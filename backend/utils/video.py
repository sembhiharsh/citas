import cv2
import numpy as np
import os
import datetime
import subprocess
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception as e:
    print(f"Warning: static_ffmpeg import failed ({e}); expecting system ffmpeg on PATH.")

def extract_audio(video_path: str, output_audio_path: str) -> bool:
    """
    Extracts the audio track from the video and saves it as a 16kHz mono WAV file,
    which is optimized for Whisper speech-to-text.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at {video_path}")
        
    # Build command to extract 16kHz mono WAV audio
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",                 # No video
        "-acodec", "pcm_s16le", # Linear PCM 16-bit
        "-ar", "16000",        # 16kHz sample rate
        "-ac", "1",            # Mono channel
        output_audio_path
    ]
    
    try:
        # Run ffmpeg subprocess, hide stdout and stderr
        result = subprocess.run(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            check=True, 
            text=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Error extracting audio with FFmpeg: {e}")
        # If ffmpeg is not found or fails, return False so the pipeline knows to skip transcription or log warning
        return False

def extract_keyframes(video_path: str, output_dir: str, max_frames: int = 6, min_distance_sec: float = 3.0) -> list:
    """
    Extracts representative keyframes from a video file based on frame difference (scene activity).
    Enforces a minimum time separation between frames to avoid temporal clustering.
    Frames are resized to a maximum width of 720px to optimize storage and inference.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at {video_path}")
        
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file with OpenCV.")
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0  # Fallback FPS
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # We sample 2 frames per second for comparison
    sample_rate_sec = 0.5
    sample_interval = max(1, int(fps * sample_rate_sec))
    
    sampled_candidates = []
    prev_gray = None
    count = 0
    
    while True:
        success, frame = cap.read()
        if not success:
            break
            
        if count % sample_interval == 0:
            timestamp_sec = count / fps
            
            # Convert to grayscale and resize to 100x100 for fast frame-difference computation
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            small_gray = cv2.resize(gray, (100, 100))
            
            diff_score = 0.0
            if prev_gray is not None:
                # Calculate mean absolute pixel intensity difference
                diff_score = float(np.mean(np.abs(small_gray.astype(np.int16) - prev_gray.astype(np.int16))))
                
            prev_gray = small_gray
            
            # Resize the actual frame to max width 720px to save storage/API usage
            h, w = frame.shape[:2]
            target_w = 720
            if w > target_w:
                target_h = int(h * (target_w / w))
                resized_frame = cv2.resize(frame, (target_w, target_h))
            else:
                resized_frame = frame.copy()
                
            sampled_candidates.append({
                "frame": resized_frame,
                "timestamp_sec": timestamp_sec,
                "diff_score": diff_score,
                "frame_idx": count
            })
            
        count += 1
        
    cap.release()
    
    if not sampled_candidates:
        return []
        
    # Selection algorithm:
    # 1. Always select the first frame (baseline)
    # 2. Select remaining candidates sorted by diff_score descending
    #    enforcing a minimum distance in seconds (min_distance_sec) from already selected frames.
    
    selected = [sampled_candidates[0]]
    sorted_candidates = sorted(sampled_candidates[1:], key=lambda x: x["diff_score"], reverse=True)
    
    for cand in sorted_candidates:
        if len(selected) >= max_frames:
            break
            
        too_close = False
        for sel in selected:
            if abs(cand["timestamp_sec"] - sel["timestamp_sec"]) < min_distance_sec:
                too_close = True
                break
                
        if not too_close:
            selected.append(cand)
            
    # Sort selected frames chronologically
    selected = sorted(selected, key=lambda x: x["timestamp_sec"])
    
    # If we have slots left, try to append the very last frame if it isn't close to any selected frames
    if len(selected) < max_frames and len(sampled_candidates) > 1:
        last_cand = sampled_candidates[-1]
        too_close = False
        for sel in selected:
            if abs(last_cand["timestamp_sec"] - sel["timestamp_sec"]) < min_distance_sec:
                too_close = True
                break
        if not too_close:
            selected.append(last_cand)
            selected = sorted(selected, key=lambda x: x["timestamp_sec"])
            
    # Write frames to output directory
    saved_frames = []
    for idx, item in enumerate(selected):
        timestamp_sec = item["timestamp_sec"]
        minutes = int(timestamp_sec // 60)
        seconds = int(timestamp_sec % 60)
        timestamp_str = f"{minutes:02d}:{seconds:02d}"
        
        filename = f"frame_{idx:02d}.jpg"
        filepath = os.path.join(output_dir, filename)
        cv2.imwrite(filepath, item["frame"])
        
        saved_frames.append({
            "filename": filename,
            "filepath": filepath,
            "timestamp": timestamp_str,
            "timestamp_sec": timestamp_sec
        })
        
    return saved_frames
