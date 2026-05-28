import os
import json
import datetime
from typing import List

# ==========================================
#  EASY CONFIGURATION: EDIT YOUR HOURS HERE!
# ==========================================
BLOCK_WEEKENDS = True  # Set to True to block Saturday & Sunday, False to allow them

# These are the only hours clients can book (in 24-hour format: "HH:MM")
WORK_SHIFTS = [
    {"start": "08:00", "end": "13:00"},  # Morning shift: 8:00 AM to 1:00 PM
    {"start": "15:00", "end": "17:30"}   # Afternoon shift: 3:00 PM to 5:30 PM
]
# ==========================================

def is_slot_available(appt_dt: datetime.datetime) -> bool:
    """Return True if the given datetime fits our work hours and rules."""
    date = appt_dt.date()
    time = appt_dt.time()

    # 1. Block appointments within the next 2 days (including today) for safety margin
    today = datetime.date.today()
    if date <= today + datetime.timedelta(days=2):
        return False

    # 2. Block weekends if configured
    if BLOCK_WEEKENDS and date.weekday() in (5, 6):  # 5 = Saturday, 6 = Sunday
        return False

    # 3. Check if the time falls into one of our active shifts
    in_shift = False
    for shift in WORK_SHIFTS:
        try:
            start_h, start_m = map(int, shift["start"].split(":"))
            end_h, end_m = map(int, shift["end"].split(":"))
            
            start_time = datetime.time(start_h, start_m)
            end_time = datetime.time(end_h, end_m)
            
            if start_time <= time <= end_time:
                in_shift = True
                break
        except Exception:
            continue

    return in_shift

DAILY_QUOTA = 5

def get_confirmed_count_for_date(target_date: datetime.date) -> int:
    """Return number of confirmed appointments for the given date."""
    confirmed = 0
    # Load appointments from JSON
    appointments_file = os.path.join(os.path.dirname(__file__), '..', 'appointments.json')
    if os.path.exists(appointments_file):
        with open(appointments_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for a in data:
                if a.get('status') == 'confirmed':
                    try:
                        appt_dt = datetime.datetime.fromisoformat(a.get('datetime'))
                        if appt_dt.date() == target_date:
                            confirmed += 1
                    except Exception:
                        continue
    return confirmed

def get_available_dates(start: datetime.date, end: datetime.date) -> List[str]:
    """Return a list of ISO date strings between start and end that are available."""
    available = []
    delta = datetime.timedelta(days=1)
    current = start
    while current <= end:
        dummy_dt = datetime.datetime.combine(current, datetime.time(12, 0))
        if is_slot_available(dummy_dt):
            available.append(current.isoformat())
        current += delta
    return available

# NEW: Count confirmed appointments for a given date
def get_confirmed_count(date: datetime.date) -> int:
    """Return number of appointments with status 'confirmed' on the given date."""
    # appointments.json is located relative to this utils module
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    appointments_path = os.path.join(base_dir, 'appointments.json')
    if not os.path.exists(appointments_path):
        return 0
    try:
        with open(appointments_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        return 0
    count = 0
    for a in data:
        if a.get('status') == 'confirmed':
            try:
                appt_dt = datetime.datetime.fromisoformat(a.get('datetime'))
                if appt_dt.date() == date:
                    count += 1
            except Exception:
                continue
    return count
def auto_approve_pending(date: datetime.date) -> None:
    """Auto-approve pending appointments for the given date up to DAILY_QUOTA."""
    # Load appointments
    appointments_file = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')), 'appointments.json')
    if not os.path.exists(appointments_file):
        return
    try:
        with open(appointments_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        return
    # Count confirmed
    confirmed = sum(1 for a in data if a.get('status') == 'confirmed' and datetime.datetime.fromisoformat(a.get('datetime')).date() == date)
    # Find pending for date
    pending = [a for a in data if a.get('status') == 'pending' and datetime.datetime.fromisoformat(a.get('datetime')).date() == date]
    # Approve as many as needed
    slots = DAILY_QUOTA - confirmed
    for a in pending[:slots]:
        a['status'] = 'confirmed'
    # Save back
    with open(appointments_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    # Broadcast update
    # Note: cannot import broadcast here directly; caller will invoke broadcast after.
