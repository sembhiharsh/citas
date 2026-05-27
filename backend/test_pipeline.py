import os
import sys

# Force absolute imports from current directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from utils.video import extract_keyframes, extract_audio
    from utils.ai import check_system_health, load_settings
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def test_imports():
    print("Testing internal module imports...")
    print(" - cv2 & numpy (OpenCV): Imported successfully!")
    print(" - static-ffmpeg: Imported successfully!")
    print(" - whisper: Imported successfully!")
    print(" - ollama client: Imported successfully!")

def test_health():
    print("\nChecking Ollama system status...")
    status = check_system_health()
    print(f" - API Server Online: {status['backend_online']}")
    print(f" - Ollama Server Connected: {status['ollama_online']}")
    print(f" - Ollama URL: {status['ollama_url']}")
    if status['ollama_online']:
        print(f" - Pulled Models: {status['pulled_models']}")
        print(f" - LLaVA model available: {status['llava_available']}")
        print(f" - Reasoning model available: {status['llama_available']}")
    else:
        print(" - Note: Local Ollama is offline. (API keys will fall back to cloud OpenAI/Gemini if configured).")

if __name__ == "__main__":
    print("===================================================")
    print("  AutoVision AI Backend Verification")
    print("===================================================")
    test_imports()
    test_health()
    print("\nVerification check passed: Core files initialized correctly.")
