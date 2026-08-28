import os
import logging
import requests

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

def send_booking_confirmation(appointment: dict) -> bool:
    """Send a branded appointment confirmation email via Resend API."""
    if not RESEND_API_KEY:
        logger.info("RESEND_API_KEY not configured, skipping Resend.")
        return False

    client_email = appointment.get("email")
    if not client_email or "@" not in str(client_email):
        logger.info("No valid client email provided in appointment, skipping Resend.")
        return False

    name = appointment.get("name", "Cliente")
    dt = appointment.get("datetime", "")
    service = appointment.get("service", "Mantenimiento General")
    car_model = appointment.get("car_model", "Vehículo")
    license_plate = appointment.get("license_plate", "")
    status = appointment.get("status", "confirmed")

    is_waiting_list = status == "waiting_list"
    subject = "⏳ Solicitud en Lista de Espera - Auto Talleres Romo" if is_waiting_list else "✅ Cita Confirmada - Auto Talleres Romo"
    headline = "Solicitud en Lista de Espera" if is_waiting_list else "¡Tu Cita está Confirmada!"
    status_badge = "En Lista de Espera" if is_waiting_list else "Cita Aceptada y Confirmada"
    status_bg = "#fef3c7" if is_waiting_list else "#dcfce7"
    status_color = "#92400e" if is_waiting_list else "#166534"

    body_desc = (
        "Hemos anotado tu solicitud con máxima prioridad en nuestra lista de espera. "
        "Nos pondremos en contacto contigo por teléfono o WhatsApp en cuanto tengamos un hueco disponible."
        if is_waiting_list else
        "Tu cita ha sido aceptada en el sistema del taller. Te esperamos el día y hora indicada a continuación."
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    
    <!-- Brand Header -->
    <div style="background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">AUTO TALLERES ROMO</h1>
      <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Taller Mecánico Especializado & Mercedes-Benz</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 24px;">
      <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; background: {status_bg}; color: {status_color}; margin-bottom: 16px;">
        {status_badge}
      </div>

      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #0f172a; font-weight: 800;">{headline}</h2>
      <p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 14px; color: #475569;">
        Hola <strong>{name}</strong>,<br>
        {body_desc}
      </p>

      <!-- Booking Details Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">📅 Fecha y Hora:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">{dt} h</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-top: 1px solid #edf2f7;">🔧 Servicio:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">{service}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-top: 1px solid #edf2f7;">🚗 Vehículo:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">{car_model} ({license_plate})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-top: 1px solid #edf2f7;">📍 Dirección:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">Carretera de Mataró, 111, 08930 Sant Adrià de Besòs (Barcelona)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-top: 1px solid #edf2f7;">📞 Contacto:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">93 462 02 54</td>
          </tr>
        </table>
      </div>

      <!-- Directions Button -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://maps.google.com/?q=Auto+Talleres+Romo+Carretera+de+Mataro+111+Sant+Adria+de+Besos" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 26px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;" target="_blank">
          Cómo Llegar en Google Maps ➔
        </a>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
        Si necesitas modificar o anular tu cita, puedes responder a este correo o contactarnos directamente por WhatsApp o teléfono al 93 462 02 54.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 4px 0;"><strong>Auto Talleres Romo</strong></p>
      <p style="margin: 0;">Carretera de Mataró, 111, 08930 · Sant Adrià de Besòs (Barcelona) | Tel: 93 462 02 54</p>
    </div>
  </div>
</body>
</html>
"""

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    # Preferred sender is info@romoautohub.es, fallback is info@citaromo.es until romoautohub.es DNS completes verification
    senders = [
        "Romo Auto Hub <info@romoautohub.es>",
        "Auto Talleres Romo <info@citaromo.es>",
        "Auto Talleres Romo <citas@citaromo.es>"
    ]

    for sender in senders:
        payload = {
            "from": sender,
            "to": [client_email],
            "reply_to": "info@romoautohub.es",
            "subject": subject,
            "html": html_content
        }
        try:
            resp = requests.post("https://api.resend.com/emails", headers=headers, json=payload, timeout=10)
            if resp.status_code in (200, 201):
                logger.info(f"Resend email successfully sent to {client_email} using '{sender}' [ID: {resp.json().get('id')}]")
                return True
            else:
                logger.warning(f"Sender '{sender}' failed [{resp.status_code}], trying next fallback sender...")
        except Exception as e:
            logger.error(f"Error trying sender '{sender}': {e}")

    return False
