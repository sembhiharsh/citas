import os
import json
import datetime
from typing import List

# ==== CONFIGURATION ====
BLOCK_WEEKENDS = True  # Block Saturday & Sunday if True
DAILY_QUOTA = 5        # Max confirmed appointments per day

# Work shifts (24-hour HH:MM)
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


# ---- Core helpers ----

def is_slot_available(appt_dt: datetime.datetime) -> bool:
    """Return True if the datetime respects work hours, weekend rules and is in the future."""
    date = appt_dt.date()
    time = appt_dt.time()

    # 1. Block appointments in the past
    if appt_dt < datetime.datetime.now():
        return False

    # 2. Optionally block weekends
    if BLOCK_WEEKENDS and date.weekday() in (5, 6):
        return False

    # 3. Must fall within one of the defined shifts
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
    """Return True if target_date already has DAILY_QUOTA confirmed appointments."""
    return get_confirmed_count_for_date(target_date) >= DAILY_QUOTA


def get_next_available_date(start_date: datetime.date) -> str:
    """Find the first available date from start_date. Returns ISO date string."""
    current = start_date
    delta = datetime.timedelta(days=1)
    for _ in range(100):
        # Use 10:00 AM as a dummy time inside the morning work shift
        dummy_dt = datetime.datetime.combine(current, datetime.time(10, 0))
        if is_slot_available(dummy_dt) and get_confirmed_count_for_date(current) < DAILY_QUOTA:
            return current.isoformat()
        current += delta
    return start_date.isoformat()


def get_available_dates(start: datetime.date, end: datetime.date) -> List[str]:
    """Return ISO-date strings for dates that are *available* (i.e. at least one slot)."""
    available = []
    delta = datetime.timedelta(days=1)
    current = start
    while current <= end:
        dummy_dt = datetime.datetime.combine(current, datetime.time(12, 0))
        if is_slot_available(dummy_dt) and get_confirmed_count_for_date(current) < DAILY_QUOTA:
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
    confirmed = sum(
        1 for a in data
        if a.get('status') == 'confirmed' and datetime.datetime.fromisoformat(a.get('datetime')).date() == date
    )
    pending = [a for a in data if a.get('status') == 'pending' and datetime.datetime.fromisoformat(a.get('datetime')).date() == date]
    slots = max(DAILY_QUOTA - confirmed, 0)
    for a in pending[:slots]:
        a['status'] = 'confirmed'
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
