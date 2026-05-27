import os
import uuid
import json
import shutil
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List

import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler()]
)

from utils.video import extract_audio, extract_keyframes
from utils.ai import (
    check_system_health, 
    load_settings, 
    save_settings, 
    run_ai_pipeline, 
    run_reel_script_generation
)

app = FastAPI(title="Workshop Video AI Assistant API")

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this. For local use, * is fine.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads directory to serve extracted frames statically
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# In-memory task tracking
# Format: { task_id: { "status": "queued|processing|completed|failed", "progress": [...], "results": dict } }
PROCESSING_TASKS = {}

# Settings schema
class SettingsModel(BaseModel):
    provider: str
    api_key_openai: Optional[str] = ""
    api_key_gemini: Optional[str] = ""
    whisper_model: Optional[str] = "base"
    ollama_url: Optional[str] = "http://localhost:11434"
    whatsapp_number: Optional[str] = ""
    shop_name: Optional[str] = "Auto Talleres Romo"
    opening_hours: Optional[str] = "Lunes a Viernes 08:30 - 18:30"

# Appointment schema
class AppointmentModel(BaseModel):
    id: Optional[str] = None
    name: str
    phone: str
    car_model: str
    license_plate: str
    service: str
    datetime: str
    status: Optional[str] = "pending" # pending | confirmed | completed | cancelled
    created_at: Optional[str] = None

APPOINTMENTS_FILE = os.path.join(BASE_DIR, "appointments.json")

def load_appointments() -> List[dict]:
    if os.path.exists(APPOINTMENTS_FILE):
        try:
            with open(APPOINTMENTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_appointments(appointments: List[dict]) -> None:
    with open(APPOINTMENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(appointments, f, indent=2)

# ==========================================
# ASYNC PIPELINE WORKER
# ==========================================

def pipeline_worker(task_id: str, video_path: str, task_dir: str):
    """
    Executes the background video processing and AI pipeline.
    Updates the PROCESSING_TASKS state and writes results to disk.
    """
    def log_progress(message: str):
        print(f"[{task_id}] {message}")
        PROCESSING_TASKS[task_id]["progress"].append(message)
        # Also write logs to a file in case of restart/persistence
        log_file = os.path.join(task_dir, "progress.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(message + "\n")

    try:
        PROCESSING_TASKS[task_id]["status"] = "processing"
        log_progress("Pipeline started.")
        
        # 1. Extract audio
        audio_path = os.path.join(task_dir, "audio.wav")
        log_progress("Extracting audio from video...")
        audio_success = extract_audio(video_path, audio_path)
        if audio_success:
            log_progress("Audio extracted successfully (16kHz WAV).")
        else:
            log_progress("Audio extraction failed. Proceeding without transcript.")
            
        # 2. Extract keyframes
        frames_dir = os.path.join(task_dir, "frames")
        log_progress("Running scene-change keyframe extraction...")
        # Max 6 frames, min 3.0s separation
        frames_info = extract_keyframes(video_path, frames_dir, max_frames=6, min_distance_sec=3.0)
        log_progress(f"Extracted {len(frames_info)} keyframes representing distinct steps.")
        
        # We need to map frame paths to URLs so the frontend can read them
        mapped_frames = []
        for f in frames_info:
            relative_url = f"/static/uploads/{task_id}/frames/{f['filename']}"
            mapped_frames.append({
                "filename": f["filename"],
                "filepath": f["filepath"],
                "url": relative_url,
                "timestamp": f["timestamp"],
                "timestamp_sec": f["timestamp_sec"]
            })
            
        # 3. Call AI pipeline
        log_progress("Initializing AI pipeline (transcription + vision + reasoning)...")
        results = run_ai_pipeline(
            audio_path=audio_path if audio_success else "",
            frames_list=mapped_frames,
            progress_callback=log_progress
        )
        
        # Add frame details back into the results structure
        # Ensure our saved frame analysis includes the correct frame url
        for idx, item in enumerate(results.get("frame_analysis", [])):
            if idx < len(mapped_frames):
                item["url"] = mapped_frames[idx]["url"]
            else:
                item["url"] = ""
                
        # Write results cache to disk
        results_path = os.path.join(task_dir, "results.json")
        with open(results_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
            
        PROCESSING_TASKS[task_id]["status"] = "completed"
        PROCESSING_TASKS[task_id]["results"] = results
        log_progress("Analysis pipeline completed successfully!")
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(error_details)
        PROCESSING_TASKS[task_id]["status"] = "failed"
        log_progress(f"Pipeline error: {str(e)}")
        PROCESSING_TASKS[task_id]["progress"].append(error_details)

# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/api/health")
def get_health():
    """Returns application connection status and available Ollama models."""
    return check_system_health()

@app.get("/api/settings")
def get_current_settings():
    """Retrieves current application config settings."""
    return load_settings()

@app.post("/api/settings")
def update_settings(settings: SettingsModel):
    """Updates global config settings (API keys, models, provider)."""
    save_settings(settings.model_dump())
    return {"status": "success", "message": "Settings updated successfully."}

@app.get("/api/appointments")
def get_appointments():
    """Retrieves all appointments from the JSON database."""
    return load_appointments()

@app.post("/api/appointments")
def create_appointment(appointment: AppointmentModel):
    """Saves a new appointment request."""
    import datetime
    from utils.scheduling import is_slot_available
    from utils.google_sheet import append_appointment_to_sheet
    
    appointments = load_appointments()
    
    # Create copy with unique ID and timestamp
    app_data = appointment.model_dump()
    app_data["id"] = str(uuid.uuid4())
    app_data["created_at"] = datetime.datetime.now().isoformat()
    if not app_data.get("status"):
        app_data["status"] = "pending"
        
    # Validate date/time
    try:
        appt_dt = datetime.datetime.fromisoformat(app_data["datetime"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO8601.")
    
    # Enforce business rules: 26 and 27 May unavailable; 28 May only 08:00-18:00
    if not is_slot_available(appt_dt):
        raise HTTPException(status_code=400, detail="Selected slot is unavailable.")
    
    # Save to local JSON DB
    appointments.append(app_data)
    save_appointments(appointments)
    
    # Write to Google Sheet (ignore failures to keep core functionality)
    try:
        append_appointment_to_sheet(app_data)
    except Exception as e:
        # Log but do not fail the request
        import logging
        logging.error(f"Google Sheet write failed: {e}")
    
    return {"status": "success", "message": "Appointment request registered.", "appointment": app_data}

@app.put("/api/appointments/{appointment_id}")
def update_appointment(appointment_id: str, payload: dict):
    """Updates status or details of an appointment."""
    appointments = load_appointments()
    found = False
    updated_appointment = None
    
    for app in appointments:
        if app["id"] == appointment_id:
            found = True
            # Update fields if provided
            if "status" in payload:
                app["status"] = payload["status"]
            if "datetime" in payload:
                app["datetime"] = payload["datetime"]
            if "name" in payload:
                app["name"] = payload["name"]
            if "phone" in payload:
                app["phone"] = payload["phone"]
            if "car_model" in payload:
                app["car_model"] = payload["car_model"]
            if "license_plate" in payload:
                app["license_plate"] = payload["license_plate"]
            if "service" in payload:
                app["service"] = payload["service"]
            updated_appointment = app
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    save_appointments(appointments)
    return {"status": "success", "message": "Appointment updated successfully.", "appointment": updated_appointment}

@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: str):
    """Deletes an appointment."""
    appointments = load_appointments()
    initial_len = len(appointments)
    appointments = [app for app in appointments if app["id"] != appointment_id]
    
    if len(appointments) == initial_len:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    save_appointments(appointments)
    return {"status": "success", "message": "Appointment deleted successfully."}

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Uploads a video, creates a task directory, saves the file,
    and returns the task ID.
    """
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".mov", ".avi", ".mkv"]:
        raise HTTPException(status_code=400, detail="Unsupported video format. Upload MP4, MOV, AVI, or MKV.")
        
    task_id = str(uuid.uuid4())
    task_dir = os.path.join(UPLOAD_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    video_path = os.path.join(task_dir, f"video{ext}")
    
    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file: {str(e)}")
        
    # Initialize in-memory status
    PROCESSING_TASKS[task_id] = {
        "status": "queued",
        "progress": ["Video uploaded successfully. Ready to analyze."],
        "video_filename": file.filename,
        "video_path": video_path,
        "task_dir": task_dir,
        "results": None
    }
    
    return {"task_id": task_id, "filename": file.filename}

@app.post("/api/process/{task_id}")
def start_processing(task_id: str, background_tasks: BackgroundTasks):
    """
    Enqueues the video analysis pipeline as a background task.
    If the task has already been processed (results.json cached on disk), returns it immediately.
    """
    if task_id not in PROCESSING_TASKS:
        # Check if directories exist (cache check)
        task_dir = os.path.join(UPLOAD_DIR, task_id)
        results_path = os.path.join(task_dir, "results.json")
        if os.path.exists(results_path):
            try:
                with open(results_path, "r", encoding="utf-8") as f:
                    cached_results = json.load(f)
                PROCESSING_TASKS[task_id] = {
                    "status": "completed",
                    "progress": ["Restored from disk cache."],
                    "results": cached_results
                }
                return {"status": "cached", "message": "Restored completed analysis from cache."}
            except Exception:
                pass
        raise HTTPException(status_code=404, detail="Task not found.")
        
    task_info = PROCESSING_TASKS[task_id]
    
    # Check if cached results are on disk even if task exists in memory (e.g. state reset)
    results_path = os.path.join(task_info["task_dir"], "results.json")
    if os.path.exists(results_path):
        try:
            with open(results_path, "r", encoding="utf-8") as f:
                cached_results = json.load(f)
            PROCESSING_TASKS[task_id]["status"] = "completed"
            PROCESSING_TASKS[task_id]["results"] = cached_results
            return {"status": "cached", "message": "Loaded cached results."}
        except Exception:
            pass

    if task_info["status"] in ["processing", "completed"]:
        return {"status": task_info["status"], "message": "Task already running or completed."}
        
    # Queue background task
    background_tasks.add_task(
        pipeline_worker,
        task_id=task_id,
        video_path=task_info["video_path"],
        task_dir=task_info["task_dir"]
    )
    
    return {"status": "processing", "message": "Processing started in background."}

@app.get("/api/status/{task_id}")
def get_task_status(task_id: str):
    """Returns the current state and progress logging of the video task."""
    if task_id not in PROCESSING_TASKS:
        # Try restoring from disk
        task_dir = os.path.join(UPLOAD_DIR, task_id)
        results_path = os.path.join(task_dir, "results.json")
        if os.path.exists(results_path):
            try:
                with open(results_path, "r", encoding="utf-8") as f:
                    results = json.load(f)
                PROCESSING_TASKS[task_id] = {
                    "status": "completed",
                    "progress": ["Restored from cache."],
                    "results": results
                }
            except Exception:
                pass
                
    if task_id not in PROCESSING_TASKS:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    task = PROCESSING_TASKS[task_id]
    return {
        "status": task["status"],
        "progress": task["progress"]
    }

@app.get("/api/results/{task_id}")
def get_task_results(task_id: str):
    """Retrieves final analysis results for a task."""
    if task_id not in PROCESSING_TASKS:
        # Try loading cached file from disk
        task_dir = os.path.join(UPLOAD_DIR, task_id)
        results_path = os.path.join(task_dir, "results.json")
        if os.path.exists(results_path):
            try:
                with open(results_path, "r", encoding="utf-8") as f:
                    results = json.load(f)
                return results
            except Exception:
                raise HTTPException(status_code=500, detail="Failed to read cached results.")
        raise HTTPException(status_code=404, detail="Results not found.")
        
    task = PROCESSING_TASKS[task_id]
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Task is in state: {task['status']}")
        
    return task["results"]

@app.post("/api/reel-script/{task_id}")
def generate_script(task_id: str):
    """Generates and caches a short video Reels script based on the task results."""
    task_dir = os.path.join(UPLOAD_DIR, task_id)
    script_path = os.path.join(task_dir, "reel_script.json")
    
    # Return from cache if exists
    if os.path.exists(script_path):
        try:
            with open(script_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
            
    # Load report results to feed the LLM
    results_path = os.path.join(task_dir, "results.json")
    if not os.path.exists(results_path):
        raise HTTPException(status_code=404, detail="Analysis results must exist to generate a script.")
        
    try:
        with open(results_path, "r", encoding="utf-8") as f:
            report_data = json.load(f)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read report data.")
        
    # Run Reels script generation
    script_data = run_reel_script_generation(report_data)
    
    # Save script to cache
    try:
        with open(script_path, "w", encoding="utf-8") as f:
            json.dump(script_data, f, indent=2)
    except Exception:
        pass
        
    return script_data

# Serve frontend static files as a fallback
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    # Start server locally on port 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
