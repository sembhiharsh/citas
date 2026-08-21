import os
import json
import datetime
from typing import List

# ==== DEFAULT CONFIGURATION ====
DEFAULT_BLOCK_WEEKENDS = True
DEFAULT_DAILY_QUOTA = 5

WORK_SHIFTS = [
    {"start": "08:00", "end": "13:00"},
    {"start": "15:00", "end": "17:30"},
]

# ---- File helpers ----

def _appointments_path() -> str:
    """Return path to appointments.json, prioritizing the /data mount if writable."""
    if os.path.exists("/data") and os.access("/data", os.W_OK):
        return "/data/appointments.json"
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base_dir, "appointments.json")


def _config_path() -> str:
    """Return path to config.json, prioritizing the /data mount if writable."""
    if os.path.exists("/data") and os.access("/data", os.W_OK):
        return "/data/config.json"
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base_dir, "config.json")


def get_schedule_settings() -> dict:
    """Load schedule configuration from config.json."""
    path = _config_path()
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {
                    "daily_quota": int(data.get("daily_quota", DEFAULT_DAILY_QUOTA)),
                    "block_weekends": bool(data.get("block_weekends", DEFAULT_BLOCK_WEEKENDS)),
                    "blocked_dates": list(data.get("blocked_dates", []))
                }
        except Exception:
            pass
    return {
        "daily_quota": DEFAULT_DAILY_QUOTA,
        "block_weekends": DEFAULT_BLOCK_WEEKENDS,
        "blocked_dates": []
    }


def get_blocked_dates() -> List[str]:
    """Return list of ISO format strings for dates manually blocked by admin."""
    return get_schedule_settings().get("blocked_dates", [])


def get_daily_quota() -> int:
    """Return max confirmed appointments allowed per day."""
    return get_schedule_settings().get("daily_quota", DEFAULT_DAILY_QUOTA)


DAILY_QUOTA = DEFAULT_DAILY_QUOTA


def is_date_blocked_by_admin(target_date: datetime.date) -> bool:
    """Return True if target_date is in the admin blocked dates list."""
    date_str = target_date.isoformat()
    return date_str in get_blocked_dates()


# ---- Core helpers ----

def is_slot_available(appt_dt: datetime.datetime) -> bool:
    """Return True if the datetime respects work hours, weekend rules, blocked dates, and is in the future."""
    date = appt_dt.date()
    time = appt_dt.time()

    # 1. Block appointments in the past
    if appt_dt < datetime.datetime.now():
        return False

    # 2. Check admin manually blocked dates
    if is_date_blocked_by_admin(date):
        return False

    # 3. Optionally block weekends
    settings = get_schedule_settings()
    if settings.get("block_weekends", True) and date.weekday() in (5, 6):
        return False

    # 4. Must fall within one of the defined shifts
    for shift in WORK_SHIFTS:
        try:
            start_h, start_m = map(int, shift["start"].split(":"))
            end_h, end_m = map(int, shift["end"].split(":"))
            start_time = datetime.time(start_h, start_m)
            end_time = datetime.time(end_h, end_m)
            if start_time <= time <= end_time:
                return True
        except Exception:
            continue
    return False


def get_confirmed_count_for_date(target_date: datetime.date) -> int:
    """Count confirmed appointments for *target_date*."""
    confirmed = 0
    path = _appointments_path()
    if not os.path.exists(path):
        return 0
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for a in data:
            if a.get("status") == "confirmed":
                try:
                    appt_dt = datetime.datetime.fromisoformat(a.get("datetime"))
                    if appt_dt.date() == target_date:
                        confirmed += 1
                except Exception:
                    continue
    except Exception:
        pass
    return confirmed


def is_date_full(target_date: datetime.date) -> bool:
    """Return True if target_date is blocked or already has max confirmed appointments."""
    if is_date_blocked_by_admin(target_date):
        return True
    quota = get_daily_quota()
    return get_confirmed_count_for_date(target_date) >= quota


def get_next_available_date(start_date: datetime.date) -> str:
    """Find the first available date from start_date. Returns ISO date string."""
    current = start_date
    delta = datetime.timedelta(days=1)
    quota = get_daily_quota()
    for _ in range(120):
        if not is_date_blocked_by_admin(current):
            dummy_dt = datetime.datetime.combine(current, datetime.time(10, 0))
            if is_slot_available(dummy_dt) and get_confirmed_count_for_date(current) < quota:
                return current.isoformat()
        current += delta
    return start_date.isoformat()


def get_available_dates(start: datetime.date, end: datetime.date) -> List[str]:
    """Return ISO-date strings for dates that are *available* (i.e. at least one slot)."""
    available = []
    delta = datetime.timedelta(days=1)
    current = start
    quota = get_daily_quota()
    while current <= end:
        if not is_date_blocked_by_admin(current):
            dummy_dt = datetime.datetime.combine(current, datetime.time(10, 0))
            if is_slot_available(dummy_dt) and get_confirmed_count_for_date(current) < quota:
                available.append(current.isoformat())
        current += delta
    return available


def auto_approve_pending(date: datetime.date) -> None:
    path = _appointments_path()
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        return
    quota = get_daily_quota()
    confirmed = sum(
        1 for a in data
        if a.get('status') == 'confirmed' and datetime.datetime.fromisoformat(a.get('datetime')).date() == date
    )
    pending = [a for a in data if a.get('status') == 'pending' and datetime.datetime.fromisoformat(a.get('datetime')).date() == date]
    slots = max(quota - confirmed, 0)
    for a in pending[:slots]:
        a['status'] = 'confirmed'
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
