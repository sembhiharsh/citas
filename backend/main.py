import os
import uuid
import json
import asyncio
import datetime
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request, status
# Removed sys.path manipulation; using proper package imports
from fastapi.middleware.cors import CORSMiddleware
import base64
from typing import List

app = FastAPI(title="Auto Talleres Romo - Appointment API")

def get_current_user(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Basic "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing basic authentication",
            headers={"WWW-Authenticate": "Basic"},
        )
    try:
        decoded = base64.b64decode(auth.split(" ")[1]).decode()
        username, _, password = decoded.partition(":")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication header",
            headers={"WWW-Authenticate": "Basic"},
        )
    if username != os.getenv("ADMIN_USERNAME", "admin") or password != os.getenv("ADMIN_PASSWORD", "admin"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return username
# Global list of active WebSocket connections for admin updates
websocket_connections: List[WebSocket] = []

@app.websocket("/ws/appointments")
async def appointments_ws(ws: WebSocket):
    await ws.accept()
    websocket_connections.append(ws)
    try:
        while True:
            # Keep connection alive; ignore inbound messages
            await ws.receive_text()
    except WebSocketDisconnect:
        websocket_connections.remove(ws)

async def broadcast_appointment_update():
    # Notify all connected admin clients that a change occurred
    for conn in list(websocket_connections):
        try:
            await conn.send_text("update")
        except Exception:
            # Remove broken connections
            websocket_connections.remove(conn)

from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List

from utils.notify import notify_appointment
from utils.scheduling import is_slot_available, get_available_dates, get_confirmed_count_for_date, DAILY_QUOTA, get_next_available_date, is_date_full
from utils.ai import check_system_health, load_settings, save_settings
from utils.whatsapp import build_whatsapp_url

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler()],
)

# FastAPI app already defined above

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------- Settings schema ----------
class SettingsModel(BaseModel):
    provider: str
    api_key_openai: Optional[str] = ""
    api_key_gemini: Optional[str] = ""
    whisper_model: Optional[str] = "base"
    ollama_url: Optional[str] = "http://localhost:11434"
    whatsapp_number: Optional[str] = ""
    shop_name: Optional[str] = "Auto Talleres Romo"
    opening_hours: Optional[str] = "Lunes a Viernes 08:30 - 18:30"

# ---------- Appointment schema ----------
class AppointmentModel(BaseModel):
    id: Optional[str] = None
    name: str
    phone: str
    car_model: str
    license_plate: str
    service: str
    datetime: str
    status: Optional[str] = "pending"  # pending | confirmed | completed | cancelled
    created_at: Optional[str] = None

from utils.scheduling import _appointments_path

def load_appointments() -> List[dict]:
    path = _appointments_path()
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump([], f)
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_appointments(appointments: List[dict]) -> None:
    path = _appointments_path()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(appointments, f, indent=2)


# ==========================================
#  ENDPOINTS
# ==========================================

@app.get("/api/health")
def get_health():
    """Returns application connection status."""
    return check_system_health()

@app.get("/ping")
def ping():
    return {"message": "pong"}



@app.get("/api/settings")
def get_current_settings():
    """Retrieves current application config settings."""
    return load_settings()


@app.post("/api/settings")
def update_settings(settings: SettingsModel):
    """Updates global config settings."""
    save_settings(settings.model_dump())
    return {"status": "success", "message": "Settings updated successfully."}


# ---------- Appointments ----------

@app.get("/api/appointments")
def get_appointments():
    """Retrieves all appointments."""
    return load_appointments()


@app.get("/api/admin/appointments/pending")
def get_pending_appointments():
    """Return appointments with status 'pending'."""
    return [a for a in load_appointments() if a.get("status") == "pending"]


@app.post("/api/appointments")
async def create_appointment(appointment: AppointmentModel):
    """Saves a new appointment request."""
    from utils.google_sheet import append_appointment_to_sheet

    appointments = load_appointments()

    app_data = appointment.model_dump()
    app_data["id"] = str(uuid.uuid4())
    app_data["created_at"] = datetime.datetime.now().isoformat()

    # Validate date/time
    try:
        appt_dt = datetime.datetime.fromisoformat(app_data["datetime"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO8601.")

    # Enforce business rules — slot must be valid (work hours, not weekend, not past)
    if not is_slot_available(appt_dt):
        raise HTTPException(status_code=400, detail="Selected slot is unavailable.")

    # Check if the day is already full (5 confirmed appointments)
    appt_date = appt_dt.date()
    if is_date_full(appt_date):
        # Find the next available date and tell the user
        next_date = get_next_available_date(appt_date + datetime.timedelta(days=1))
        raise HTTPException(
            status_code=409,
            detail=f"Este día ya está completo (máximo {DAILY_QUOTA} citas). El próximo día disponible es: {next_date}"
        )

    # Auto-confirm since we know quota is not exceeded
    app_data["status"] = "confirmed"

    # Save to local JSON DB
    appointments.append(app_data)
    save_appointments(appointments)
    # Notify admin clients of new/updated appointment
    await broadcast_appointment_update()

    # Write to Google Sheet (ignore failures)
    try:
        append_appointment_to_sheet(app_data)
    except Exception as e:
        logging.error(f"Google Sheet write failed: {e}")

    return {"status": "success", "message": "Cita confirmada.", "appointment": app_data}


@app.patch("/api/appointments/{appointment_id}")
async def update_appointment_status(appointment_id: str, payload: dict):
    """Update status or details of an appointment (admin). Triggers Telegram/Slack notification and broadcasts update."""
    appointments = load_appointments()
    for a in appointments:
        if a["id"] == appointment_id:
            # Update status if provided
            if "status" in payload:
                new_status = payload["status"]
                if new_status not in {"confirmed", "cancelled", "pending"}:
                    raise HTTPException(status_code=400, detail="Invalid status value")
                a["status"] = new_status
                # Notify via Telegram / Slack if confirming or cancelling
                if new_status in {"confirmed", "cancelled"}:
                    notify_appointment(new_status, a)

            # Update datetime if provided
            if "datetime" in payload:
                a["datetime"] = payload["datetime"]

            # Update other fields if provided
            if "name" in payload:
                a["name"] = payload["name"]
            if "phone" in payload:
                a["phone"] = payload["phone"]

            save_appointments(appointments)

            # Generate WhatsApp URL for confirmed or cancelled status
            whatsapp_url = ""
            if new_status in {"confirmed", "cancelled"}:
                # Load settings to get default WhatsApp number if needed
                settings = load_settings()
                phone = a.get("phone") or settings.get("whatsapp_number", "")
                whatsapp_url = build_whatsapp_url(
                    phone=phone,
                    name=a.get("name", ""),
                    datetime_iso=a.get("datetime", ""),
                    status=new_status,
                )

            # After updating status, attempt auto-approve for the appointment's date
            if "status" in payload and payload["status"] == "confirmed":
                from utils.scheduling import auto_approve_pending
                appt_date = datetime.datetime.fromisoformat(a["datetime"]).date()
                auto_approve_pending(appt_date)

            # Broadcast update to admin UI
            await broadcast_appointment_update()
            response = {"status": "success", "message": "Appointment updated successfully.", "appointment": a}
            if whatsapp_url:
                response["whatsapp_url"] = whatsapp_url
            return response
    raise HTTPException(status_code=404, detail="Appointment not found")


@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    """Deletes an appointment and broadcasts update."""
    appointments = load_appointments()
    initial_len = len(appointments)
    appointments = [a for a in appointments if a["id"] != appointment_id]
    if len(appointments) == initial_len:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    save_appointments(appointments)
    # Broadcast update to admin UI
    await broadcast_appointment_update()
    return {"status": "success", "message": "Appointment deleted successfully."}


# ---------- Available Dates ----------

@app.get("/api/available-dates")
def api_available_dates(start: str, end: str):
    """Return list of available dates between start and end (YYYY-MM-DD)."""
    try:
        start_date = datetime.datetime.strptime(start, "%Y-%m-%d").date()
        end_date = datetime.datetime.strptime(end, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    return get_available_dates(start_date, end_date)


@app.get("/api/next-available-date")
def api_next_available_date(from_date: Optional[str] = None):
    """Return the next available date starting from from_date (YYYY-MM-DD) or today."""
    try:
        if from_date:
            start_date = datetime.datetime.strptime(from_date, "%Y-%m-%d").date()
        else:
            start_date = datetime.datetime.now().date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    next_date = get_next_available_date(start_date)
    return {"next_available_date": next_date}


# ---------- Admin Dashboard ----------

@app.get("/admin", response_class=HTMLResponse, dependencies=[Depends(get_current_user)])
def admin_page():
    """Serve the admin dashboard page."""
    admin_path = os.path.join(BASE_DIR, "admin.html")
    if not os.path.exists(admin_path):
        raise HTTPException(status_code=404, detail="Admin page not found.")
    return FileResponse(admin_path, media_type="text/html")


# ---------- Frontend static files ----------

FRONTEND_DIR = os.path.join(BASE_DIR, "frontend", "dist")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
