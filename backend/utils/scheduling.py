import datetime

def is_slot_available(appt_dt: datetime.datetime) -> bool:
    """Return True if the given datetime is allowed according to business rules.
    Rules:
    - 26 May 2026 and 27 May 2026 are fully booked (unavailable).
    - 28 May 2026 is available only between 08:00 and 18:00 inclusive.
    - All other dates are allowed (you may tighten this later).
    """
    # Ensure timezone‑naive datetime is treated as local time
    date = appt_dt.date()
    # Block appointments within the next 2 days (including today)
    today = datetime.date.today()
    if date <= today + datetime.timedelta(days=2):
        return False
    # Unavailable days
    if date == datetime.date(2026, 5, 26) or date == datetime.date(2026, 5, 27):
        return False
    # 28 May special hours
    if date == datetime.date(2026, 5, 28):
        start = datetime.time(8, 0)
        end = datetime.time(18, 0)
        return start <= appt_dt.time() <= end
    # Default allow
    return True
