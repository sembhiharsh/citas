import os
import json
import base64
try:
    import ollama
except ImportError:
    ollama = None
from typing import List, Optional
from pydantic import BaseModel, Field
from PIL import Image

# Config file path
def _config_path() -> str:
    if os.path.exists("/data") and os.access("/data", os.W_OK):
        return "/data/config.json"
    return os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.json")

def load_settings() -> dict:
    """Loads configuration settings from config.json."""
    path = _config_path()
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "provider": "local",  # local, openai, gemini
        "api_key_openai": "",
        "api_key_gemini": "",
        "whisper_model": "base", # tiny, base, small
        "ollama_url": "http://localhost:11434",
        "whatsapp_number": "",
        "shop_name": "Auto Talleres Romo",
        "opening_hours": "Lunes a Viernes 08:30 - 18:30"
    }

def save_settings(settings: dict) -> None:
    """Saves configuration settings to config.json."""
    with open(_config_path(), "w") as f:
        json.dump(settings, f, indent=2)

def get_ollama_client():
    """Creates a custom Ollama client using the configured URL."""
    if ollama is None:
        raise ImportError("The 'ollama' Python package is not installed.")
    settings = load_settings()
    url = settings.get("ollama_url", "http://localhost:11434")
    return ollama.Client(host=url)

def check_system_health() -> dict:
    """
    Checks the status of the local backend and Ollama.
    Returns details on pulled models and connectivity.
    """
    status = {
        "backend_online": True,
        "ollama_online": False,
        "ollama_url": "",
        "pulled_models": [],
        "llava_available": False,
        "llama_available": False,
    }
    
    settings = load_settings()
    status["ollama_url"] = settings.get("ollama_url", "http://localhost:11434")
    
    try:
        client = get_ollama_client()
        models_response = client.list()
        status["ollama_online"] = True
        
        models = models_response.get("models", [])
        status["pulled_models"] = [m.get("model", m.get("name", "")) for m in models]
        
        status["llava_available"] = any("llava" in m.lower() for m in status["pulled_models"])
        status["llama_available"] = any(
            any(name in m.lower() for name in ["llama", "qwen", "mistral", "gemma", "phi"])
            for m in status["pulled_models"]
        )
    except Exception as e:
        status["ollama_error"] = str(e)
        
    return status

# ==========================================
# SPEECH-TO-TEXT (WHISPER)
# ==========================================

def transcribe_audio(audio_path: str, provider: str, api_key: str = "", whisper_model: str = "base") -> str:
    """
    Transcribes audio path.
    If provider is 'local', uses local Whisper.
    If provider is 'openai' or 'gemini', attempts to use OpenAI's API.
    """
    if not os.path.exists(audio_path):
        return "[No audio track detected or extracted]"
        
    if provider == "local":
        try:
            import whisper
            print(f"Loading local Whisper model '{whisper_model}'...")
            model = whisper.load_model(whisper_model)
            print("Transcribing audio locally...")
            result = model.transcribe(audio_path)
            return result.get("text", "").strip()
        except ImportError:
            return "[Error: whisper python package is not installed correctly. Try pip install openai-whisper]"
        except Exception as e:
            return f"[Local Whisper transcription error: {str(e)}]"
            
    else:
        # For cloud providers, use OpenAI Whisper API if key is available
        # If gemini is active but openai key is available, we can also use it
        key = api_key if api_key else load_settings().get("api_key_openai", "")
        if not key:
            # If no OpenAI key, fall back to local transcription if possible
            print("No OpenAI API key for Whisper. Falling back to local Whisper...")
            return transcribe_audio(audio_path, "local", whisper_model=whisper_model)
            
        try:
            from openai import OpenAI
            client = OpenAI(api_key=key)
            print("Transcribing audio via OpenAI Cloud API...")
            with open(audio_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            return transcript.text.strip()
        except Exception as e:
            print(f"Cloud Whisper failed: {e}. Falling back to local...")
            return transcribe_audio(audio_path, "local", whisper_model=whisper_model)

# ==========================================
# KEYFRAME VISION ANALYSIS
# ==========================================

def analyze_frame_local(image_path: str) -> str:
    """Analyzes a keyframe image locally using Ollama LLaVA model."""
    try:
        client = get_ollama_client()
        response = client.chat(
            model="llava",
            messages=[{
                "role": "user",
                "content": "Describe what is happening in this car repair scene. Focus on the vehicle damage, parts being worked on, or tools being used. Be extremely concise (max 2 sentences).",
                "images": [image_path]
            }]
        )
        return response['message']['content'].strip()
    except Exception as e:
        return f"[Local Vision Error: {e}]"

def analyze_frame_openai(image_path: str, api_key: str) -> str:
    """Analyzes a keyframe image using OpenAI GPT-4o-mini."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe what is happening in this car repair scene. Focus on the vehicle damage, parts being worked on, or tools being used. Be extremely concise (max 2 sentences)."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[OpenAI Vision Error: {e}]"

def analyze_frame_gemini(image_path: str, api_key: str) -> str:
    """Analyzes a keyframe image using Gemini 1.5 Flash."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        img = Image.open(image_path)
        response = model.generate_content([
            "Describe what is happening in this car repair scene. Focus on the vehicle damage, parts being worked on, or tools being used. Be extremely concise (max 2 sentences).",
            img
        ])
        return response.text.strip()
    except Exception as e:
        return f"[Gemini Vision Error: {e}]"

# ==========================================
# REASONING ENGINE
# ==========================================

def get_reasoning_prompt(audio_transcript: str, frame_analyses: List[dict]) -> str:
    return f"""
You are a professional automotive workshop analyst and social media content marketer.
Analyze the following audio transcription and keyframe visual observations extracted from a workshop repair video.

AUDIO TRANSCRIPTION:
\"\"\"{audio_transcript}\"\"\"

KEYFRAME VISUAL OBSERVATIONS:
{json.dumps(frame_analyses, indent=2)}

Task:
Generate a unified analysis report of the repair event.
Your response MUST be a single, valid JSON object containing exactly the keys detailed below. 
Do not include any markdown backticks (like ```json), introduction, or conversational filler.

Required JSON format:
{{
  "damage_summary": "Provide a descriptive summary of the damage details, components involved, and underlying issues.",
  "severity": "low" | "medium" | "high",
  "repair_plan": [
    "Step 1: description of repair action",
    "Step 2: description of repair action",
    "etc."
  ],
  "customer_explanation": "Explain what was wrong and how it was fixed in clear, simple terms. Avoid overly complex technical jargon so a non-technical customer understands it.",
  "instagram_caption_es": "Write an emotional, viral-style Instagram caption in Spanish. Include hook, emojis, workshop storytelling, and relevant hashtags.",
  "instagram_caption_en": "Write a clean, professional, shorter Instagram caption in English. Include emojis and hashtags.",
  "viral_hook": "Write a punchy, click-worthy hook line (max 10 words) for TikTok/Reels.",
  "frame_analysis": [
    {{
      "timestamp": "The timestamp corresponding to the keyframe (e.g. 00:05)",
      "description": "An edited, high-quality summary of what is seen at this timestamp, combining the observation with the overall repair context."
    }}
  ]
}}
"""

def generate_report_local(prompt: str) -> str:
    """Generates structured report locally using LLaMA 3 via Ollama."""
    client = get_ollama_client()
    # Try to use llama3, if not available, search for llama model or use first available
    model_name = "llama3"
    try:
        pulled = [m.get("model", m.get("name", "")) for m in client.list().get("models", [])]
        if not any("llama3" in m.lower() for m in pulled):
            # Fallback to any model containing llama or first model
            llama_models = [m for m in pulled if "llama" in m.lower() or "qwen" in m.lower() or "mistral" in m.lower()]
            if llama_models:
                model_name = llama_models[0]
            elif pulled:
                model_name = pulled[0]
    except Exception:
        pass
        
    print(f"Running LLaMA reasoning model locally using '{model_name}'...")
    response = client.chat(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": 0.2},
        format="json"
    )
    return response['message']['content'].strip()

def generate_report_openai(prompt: str, api_key: str) -> str:
    """Generates structured report using OpenAI GPT-4o-mini."""
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    print("Running LLaMA reasoning model equivalent (GPT-4o-mini)...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content.strip()

def generate_report_gemini(prompt: str, api_key: str) -> str:
    """Generates structured report using Gemini 1.5 Flash."""
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    print("Running LLaMA reasoning model equivalent (Gemini 1.5 Flash)...")
    model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
    response = model.generate_content(prompt)
    return response.text.strip()

def parse_and_validate_json(raw_text: str) -> dict:
    """Cleans JSON response from LLM and validates structure."""
    text = raw_text.strip()
    
    # Strip markdown wrapper if present
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    # Parse JSON
    data = json.loads(text)
    
    # Assert structural keys
    required = ["damage_summary", "severity", "repair_plan", "customer_explanation", "instagram_caption_es", "instagram_caption_en", "viral_hook", "frame_analysis"]
    for key in required:
        if key not in data:
            data[key] = "" if key != "repair_plan" and key != "frame_analysis" else []
            
    # Validate severity
    sev = str(data["severity"]).lower()
    if "low" in sev:
        data["severity"] = "low"
    elif "high" in sev:
        data["severity"] = "high"
    else:
        data["severity"] = "medium"
        
    return data

# ==========================================
# PIPELINE ENTRYPOINT
# ==========================================

def run_ai_pipeline(audio_path: str, frames_list: List[dict], progress_callback) -> dict:
    """
    Executes the entire speech-to-text, keyframe vision analysis, and reasoning steps.
    """
    settings = load_settings()
    provider = settings.get("provider", "local")
    api_key_openai = settings.get("api_key_openai", "")
    api_key_gemini = settings.get("api_key_gemini", "")
    whisper_model = settings.get("whisper_model", "base")
    
    # 1. Speech to Text
    progress_callback("Running audio transcription...")
    if provider == "openai":
        transcript = transcribe_audio(audio_path, "openai", api_key_openai)
    elif provider == "gemini":
        # Gemini backend falls back to OpenAI Whisper API if key is there, else local Whisper
        transcript = transcribe_audio(audio_path, "openai", api_key_openai)
    else:
        transcript = transcribe_audio(audio_path, "local", whisper_model=whisper_model)
        
    progress_callback(f"Audio transcription complete: \"{transcript[:50]}...\"")
    
    # 2. Vision analysis per keyframe
    frame_analyses = []
    for idx, f in enumerate(frames_list):
        progress_callback(f"Analyzing keyframe {idx+1}/{len(frames_list)} at timestamp {f['timestamp']}...")
        
        if provider == "openai" and api_key_openai:
            desc = analyze_frame_openai(f["filepath"], api_key_openai)
        elif provider == "gemini" and api_key_gemini:
            desc = analyze_frame_gemini(f["filepath"], api_key_gemini)
        else:
            desc = analyze_frame_local(f["filepath"])
            
        print(f"Frame {idx} ({f['timestamp']}) description: {desc}")
        frame_analyses.append({
            "timestamp": f["timestamp"],
            "frame": f["filename"],
            "description": desc
        })
        
    progress_callback("Visual keyframe analysis complete.")
    
    # 3. Reasoning Layer
    progress_callback("Generating final report with reasoning model...")
    prompt = get_reasoning_prompt(transcript, frame_analyses)
    
    raw_response = ""
    error_msg = ""
    
    try:
        if provider == "openai" and api_key_openai:
            raw_response = generate_report_openai(prompt, api_key_openai)
        elif provider == "gemini" and api_key_gemini:
            raw_response = generate_report_gemini(prompt, api_key_gemini)
        else:
            raw_response = generate_report_local(prompt)
            
        report_data = parse_and_validate_json(raw_response)
    except Exception as e:
        error_msg = str(e)
        print(f"AI Reasoning failed or returned invalid JSON: {e}. Retrying with strict instruction...")
        
        # Retry logic with stricter prompt
        retry_prompt = f"{prompt}\n\nWARNING: Your previous attempt failed to parse as valid JSON. Error: {error_msg}. Make absolutely sure to output ONLY valid JSON without markdown tags."
        try:
            if provider == "openai" and api_key_openai:
                raw_response = generate_report_openai(retry_prompt, api_key_openai)
            elif provider == "gemini" and api_key_gemini:
                raw_response = generate_report_gemini(retry_prompt, api_key_gemini)
            else:
                raw_response = generate_report_local(retry_prompt)
                
            report_data = parse_and_validate_json(raw_response)
        except Exception as retry_e:
            progress_callback(f"AI Reasoning failed on retry: {retry_e}")
            # Final fallback
            report_data = {
                "damage_summary": "Failed to analyze video automatically.",
                "severity": "medium",
                "repair_plan": ["Manually inspect the vehicle structure"],
                "customer_explanation": "We encountered an error processing the AI reasoning layer.",
                "instagram_caption_es": "¡Taller en acción! 🔧 No pudimos generar el texto automático, pero el trabajo sigue. 💪",
                "instagram_caption_en": "Workshop in action! 🔧 Cloud or local reasoning failure, but we keep pushing. 💪",
                "viral_hook": "Repair in progress",
                "frame_analysis": frame_analyses
            }
            
    progress_callback("Structured report generated.")
    return report_data

# ==========================================
# REEL SCRIPT GENERATION
# ==========================================

def run_reel_script_generation(report_data: dict) -> dict:
    """Generates a viral reel script based on the final analysis JSON."""
    settings = load_settings()
    provider = settings.get("provider", "local")
    api_key_openai = settings.get("api_key_openai", "")
    api_key_gemini = settings.get("api_key_gemini", "")
    
    prompt = f"""
You are a viral social media director specializing in automotive content for TikTok, Instagram Reels, and YouTube Shorts.
Create a high-retention, engaging short-form video script based on this workshop report:

DAMAGE SUMMARY:
{report_data.get('damage_summary')}

REPAIR PLAN:
{json.dumps(report_data.get('repair_plan'))}

VIRAL HOOK:
{report_data.get('viral_hook')}

The output must be a single, valid JSON object containing exactly the keys detailed below.
Do not include any markdown block formatting (like ```json), introduction, or conversational filler.

Required JSON format:
{{
  "hook_scene": "Visual description of the opening hook scene (first 3 seconds)",
  "hook_narration": "What is spoken in the first 3 seconds to hook the viewer (max 12 words)",
  "scenes": [
    {{
      "visual": "Visual description for this segment",
      "narration": "Voiceover narrative line for this segment",
      "text_overlay": "On-screen text subtitles (max 4-5 words)",
      "duration": "Duration in seconds (e.g. 3)"
    }}
  ],
  "call_to_action": "Narrator ending line + final scene details directing viewers to follow/comment"
}}
"""
    raw_response = ""
    try:
        if provider == "openai" and api_key_openai:
            raw_response = generate_report_openai(prompt, api_key_openai)
        elif provider == "gemini" and api_key_gemini:
            raw_response = generate_report_gemini(prompt, api_key_gemini)
        else:
            raw_response = generate_report_local(prompt)
            
        # Standard clean & load
        text = raw_response.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        return json.loads(text)
    except Exception as e:
        print(f"Reel script generation failed: {e}")
        # Return fallback script
        return {
            "hook_scene": "Close up of the vehicle damage shown in the video",
            "hook_narration": f"Look at this: {report_data.get('viral_hook') or 'Another challenge in the shop.'}",
            "scenes": [
                {
                    "visual": "Mechanic inspecting and starting repairs",
                    "narration": "We brought it in, identified the issue, and got straight to work.",
                    "text_overlay": "First step: disassembly",
                    "duration": 4
                },
                {
                    "visual": "Mechanic completing the final touch",
                    "narration": "Following our structured repair plan, we brought it back to perfection.",
                    "text_overlay": "Done right!",
                    "duration": 4
                }
            ],
            "call_to_action": "Drop a comment if you'd drive this! Follow for more garage builds."
        }
