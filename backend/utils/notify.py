import os
import json
import logging
import http.client
from urllib.parse import urlencode

log = logging.getLogger(__name__)

def _load_setting(key: str) -> str:
    """Load a setting from environment variables or settings file.
    The backend settings are stored in the JSON file used by utils.ai.
    """
    # First try environment variables (useful for deployment)
    value = os.getenv(key)
    if value:
        return value
    # Fallback: try to load from settings.json (if it exists)
    try:
        from utils.ai import load_settings
        settings = load_settings()
        return settings.get(key)
    except Exception:
        return None

def send_telegram_message(message: str) -> bool:
    """Send a simple text message via Telegram Bot API.
    Requires environment variables or settings:
      - telegram_bot_token
      - telegram_chat_id
    Returns True on success, False otherwise.
    """
    token = _load_setting('telegram_bot_token')
    chat_id = _load_setting('telegram_chat_id')
    if not token or not chat_id:
        log.warning('Telegram credentials not configured.')
        return False
    try:
        conn = http.client.HTTPSConnection('api.telegram.org')
        payload = urlencode({
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'Markdown'
        })
        url = f'/bot{token}/sendMessage'
        conn.request('POST', url, payload, {'Content-Type': 'application/x-www-form-urlencoded'})
        resp = conn.getresponse()
        data = resp.read().decode()
        if resp.status != 200:
            log.error(f'Telegram API error {resp.status}: {data}')
            return False
        result = json.loads(data)
        return result.get('ok', False)
    except Exception as e:
        log.exception('Failed to send Telegram message')
        return False

def send_slack_message(message: str) -> bool:
    """Send a simple message to a Slack Incoming Webhook URL.
    Requires setting `slack_webhook_url`.
    Returns True on success.
    """
    webhook_url = _load_setting('slack_webhook_url')
    if not webhook_url:
        log.warning('Slack webhook URL not configured.')
        return False
    try:
        conn = http.client.HTTPSConnection('hooks.slack.com')
        # Split the webhook URL to extract host and path
        # Expected format: https://hooks.slack.com/services/xxx/yyy/zzz
        from urllib.parse import urlparse
        parsed = urlparse(webhook_url)
        path = parsed.path
        payload = json.dumps({"text": message}).encode('utf-8')
        conn.request('POST', path, payload, {'Content-Type': 'application/json'})
        resp = conn.getresponse()
        data = resp.read().decode()
        if resp.status != 200:
            log.error(f'Slack webhook error {resp.status}: {data}')
            return False
        return data.strip() == 'ok'
    except Exception as e:
        log.exception('Failed to send Slack message')
        return False

def notify_appointment(status: str, appointment: dict) -> None:
    """Send a notification to configured channels about an appointment status change.
    `status` is either "confirmed" or "cancelled".
    """
    name = appointment.get('name', 'Cliente')
    phone = appointment.get('phone', '')
    dt = appointment.get('datetime', '')
    message = (
        f"*Cita {status.upper()}*\n"
        f"*Nombre:* {name}\n"
        f"*Teléfono:* {phone}\n"
        f"*Fecha/Hora:* {dt}\n"
    )
    # Try Telegram first, then Slack as fallback.
    sent = send_telegram_message(message)
    if not sent:
        send_slack_message(message)
