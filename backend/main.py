import os
import json
import uuid
import datetime
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, status, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils.ai import (
    check_system_health,
    load_settings,
    save_settings,
)
from utils.scheduling import (
    is_slot_available,
    is_date_full,
    get_next_available_date,
    get_available_dates,
    get_blocked_dates,
    get_daily_quota,
    is_date_blocked_by_admin,
    auto_approve_pending,
    DAILY_QUOTA,
)
from utils.notify import notify_appointment
from utils.whatsapp import build_whatsapp_url

# Initialize logging
logging.basicConfig(level=logging.INFO)

# --- Active WebSocket Connections Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

async def broadcast_appointment_update():
    """Helper to broadcast latest appointment updates over WS."""
    await manager.broadcast({"type": "UPDATE_APPOINTMENTS"})

# FastAPI app definition
app = FastAPI(title="Auto Talleres Romo API", version="2.0.0")

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
    provider: Optional[str] = "ollama"
    api_key_openai: Optional[str] = ""
    api_key_gemini: Optional[str] = ""
    whisper_model: Optional[str] = "base"
    ollama_url: Optional[str] = "http://localhost:11434"
    whatsapp_number: Optional[str] = "34600000000"
    shop_name: Optional[str] = "Auto Talleres Romo"
    opening_hours: Optional[str] = "Lunes a Viernes 08:30 - 13:00 / 15:00 - 18:30"
    daily_quota: Optional[int] = 5
    block_weekends: Optional[bool] = True
    blocked_dates: Optional[List[str]] = []
    custom_daily_quotas: Optional[dict] = {}

class BlockDatePayload(BaseModel):
    date: Optional[str] = None
    dates: Optional[List[str]] = None

class SetDayQuotaPayload(BaseModel):
    date: str
    quota: Optional[int] = 5
    blocked: Optional[bool] = None

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
async def update_settings(settings: SettingsModel):
    """Updates global config settings."""
    save_settings(settings.model_dump())
    await broadcast_appointment_update()
    return {"status": "success", "message": "Settings updated successfully."}


# ---------- Blocked Dates Controls ----------

@app.get("/api/blocked-dates")
def get_blocked_dates_api():
    """Return all dates currently blocked by workshop admin."""
    return get_blocked_dates()


@app.post("/api/admin/blocked-dates")
async def add_blocked_dates(payload: BlockDatePayload):
    """Block one or more dates from receiving bookings."""
    settings = load_settings()
    current_blocked = set(settings.get("blocked_dates", []))
    
    if payload.date:
        current_blocked.add(payload.date.strip())
    if payload.dates:
        for d in payload.dates:
            current_blocked.add(d.strip())
            
    settings["blocked_dates"] = sorted(list(current_blocked))
    save_settings(settings)
    await broadcast_appointment_update()
    return {"status": "success", "blocked_dates": settings["blocked_dates"]}


@app.delete("/api/admin/blocked-dates/{date_str}")
async def remove_blocked_date(date_str: str):
    """Unblock a previously blocked date."""
    settings = load_settings()
    current_blocked = set(settings.get("blocked_dates", []))
    if date_str in current_blocked:
        current_blocked.remove(date_str)
    settings["blocked_dates"] = sorted(list(current_blocked))
    save_settings(settings)
    await broadcast_appointment_update()
    return {"status": "success", "blocked_dates": settings["blocked_dates"]}


@app.post("/api/admin/toggle-blocked-date")
async def toggle_blocked_date(payload: BlockDatePayload):
    """Toggle a date between blocked and unblocked."""
    if not payload.date:
        raise HTTPException(status_code=400, detail="Date is required.")
    date_clean = payload.date.strip()
    settings = load_settings()
    current_blocked = set(settings.get("blocked_dates", []))
    
    if date_clean in current_blocked:
        current_blocked.remove(date_clean)
        is_blocked = False
    else:
        current_blocked.add(date_clean)
        is_blocked = True
        
    settings["blocked_dates"] = sorted(list(current_blocked))
    save_settings(settings)
    await broadcast_appointment_update()
    return {"status": "success", "date": date_clean, "is_blocked": is_blocked, "blocked_dates": settings["blocked_dates"]}


@app.post("/api/admin/set-day-quota")
async def set_day_quota(payload: SetDayQuotaPayload):
    """Set custom quota for a specific date or toggle its block status."""
    date_clean = payload.date.strip()
    settings = load_settings()
    custom_quotas = settings.get("custom_daily_quotas", {})
    blocked_dates = set(settings.get("blocked_dates", []))

    if payload.quota is not None:
        custom_quotas[date_clean] = int(payload.quota)
        if int(payload.quota) <= 0:
            blocked_dates.add(date_clean)
        else:
            if date_clean in blocked_dates and (payload.blocked is None or payload.blocked is False):
                blocked_dates.remove(date_clean)

    if payload.blocked is True:
        blocked_dates.add(date_clean)
    elif payload.blocked is False:
        if date_clean in blocked_dates:
            blocked_dates.remove(date_clean)

    settings["custom_daily_quotas"] = custom_quotas
    settings["blocked_dates"] = sorted(list(blocked_dates))
    save_settings(settings)
    await broadcast_appointment_update()
    return {
        "status": "success",
        "date": date_clean,
        "quota": custom_quotas.get(date_clean, settings.get("daily_quota", 5)),
        "is_blocked": date_clean in blocked_dates,
        "blocked_dates": settings["blocked_dates"],
        "custom_daily_quotas": settings["custom_daily_quotas"]
    }


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

    # Enforce business rules — slot must be valid (work hours, not weekend, not past, not blocked)
    if not is_slot_available(appt_dt):
        raise HTTPException(status_code=400, detail="El turno seleccionado no está disponible o el día está cerrado.")

    # Check if the day is already full or blocked
    appt_date = appt_dt.date()
    if is_date_full(appt_date):
        next_date = get_next_available_date(appt_date + datetime.timedelta(days=1))
        quota = get_daily_quota()
        raise HTTPException(
            status_code=409,
            detail=f"Este día ya está completo o cerrado por el taller (máximo {quota} citas). El próximo día disponible es: {next_date}"
        )

    # Auto-confirm since quota is not exceeded
    app_data["status"] = "confirmed"

    # Save to local JSON DB
    appointments.append(app_data)
    save_appointments(appointments)
    
    # Notify admin clients of new appointment
    await broadcast_appointment_update()

    # Write to Google Sheet (ignore failures)
    try:
        append_appointment_to_sheet(app_data)
    except Exception as e:
        logging.error(f"Google Sheet write failed: {e}")

    return {"status": "success", "message": "Cita confirmada.", "appointment": app_data}


@app.patch("/api/appointments/{appointment_id}")
async def update_appointment_status(appointment_id: str, payload: dict):
    """Update status or any details of an appointment (admin)."""
    appointments = load_appointments()
    for a in appointments:
        if a["id"] == appointment_id:
            new_status = payload.get("status", a.get("status"))
            
            # Update status if provided
            if "status" in payload:
                if new_status not in {"confirmed", "cancelled", "pending", "completed"}:
                    raise HTTPException(status_code=400, detail="Invalid status value")
                a["status"] = new_status
                if new_status in {"confirmed", "cancelled"}:
                    notify_appointment(new_status, a)

            # Update datetime if provided
            if "datetime" in payload:
                a["datetime"] = payload["datetime"]

            # Update client and car fields if provided
            if "name" in payload:
                a["name"] = payload["name"]
            if "phone" in payload:
                a["phone"] = payload["phone"]
            if "car_model" in payload:
                a["car_model"] = payload["car_model"]
            if "license_plate" in payload:
                a["license_plate"] = payload["license_plate"]
            if "service" in payload:
                a["service"] = payload["service"]

            save_appointments(appointments)

            # Generate WhatsApp URL for quick response
            whatsapp_url = ""
            if new_status in {"confirmed", "cancelled"}:
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
                try:
                    appt_date = datetime.datetime.fromisoformat(a["datetime"]).date()
                    auto_approve_pending(appt_date)
                except Exception:
                    pass

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
    return {"next_available_date": get_next_available_date(start_date)}


# ---------- WebSocket Endpoint ----------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# ---------- Admin Basic Auth ----------

security = HTTPBasic()

def authenticate_admin(credentials: HTTPBasicCredentials = Depends(security)):
    admin_user = os.getenv("ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin")
    if credentials.username != admin_user or credentials.password != admin_pass:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@app.get("/admin", response_class=HTMLResponse)
def admin_panel(user: str = Depends(authenticate_admin)):
    """Serves the Admin Panel HTML interface."""
    admin_file = os.path.join(BASE_DIR, "admin.html")
    if not os.path.exists(admin_file):
        raise HTTPException(status_code=404, detail="Admin panel template not found.")
    with open(admin_file, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content=content, headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"})


# ---------- Static Frontend Fallback ----------

FRONTEND_DIST = os.path.abspath(os.path.join(BASE_DIR, "frontend", "dist"))
if not os.path.exists(FRONTEND_DIST):
    FRONTEND_DIST = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
else:
    @app.get("/")
    def root_fallback():
        return {"message": "Auto Talleres Romo Backend API is running.", "admin": "/admin", "docs": "/docs"}
