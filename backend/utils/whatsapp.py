import urllib.parse

def build_whatsapp_url(phone: str, name: str, datetime_iso: str, status: str) -> str:
    """Construct a WhatsApp Web URL with a pre‑filled message.

    Args:
        phone: Recipient phone number (digits only) – if empty, opens generic chat.
        name: Client name.
        datetime_iso: ISO‑8601 datetime string of the appointment.
        status: Either "confirmed" or "cancelled".
    Returns:
        A URL that opens WhatsApp Web with the appropriate message.
    """
    base = f"https://wa.me/{phone}" if phone else "https://wa.me/"
    status_msg = "Su cita ha sido confirmada" if status == "confirmed" else "Su cita ha sido cancelada"
    # Convert ISO to readable format, replace "T" with space.
    readable_dt = datetime_iso.replace("T", " ")
    text = f"Hola {name}, {status_msg} para el {readable_dt}. Gracias."
    return f"{base}?text={urllib.parse.quote(text)}"
