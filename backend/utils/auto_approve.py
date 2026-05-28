import json
import os
from datetime import date

AUTO_APPROVE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'auto_approve.json')

def load_auto_approve():
    """Load auto‑approve configuration. Returns dict with keys 'date' (YYYY‑MM‑DD) and 'quota' (int) or None if not set."""
    try:
        with open(AUTO_APPROVE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None

def save_auto_approve(cfg: dict) -> None:
    """Save auto‑approve configuration to disk."""
    with open(AUTO_APPROVE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, indent=2)

def clear_auto_approve():
    """Remove existing configuration (disable auto‑approve)."""
    if os.path.exists(AUTO_APPROVE_FILE):
        os.remove(AUTO_APPROVE_FILE)
