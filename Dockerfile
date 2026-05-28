FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for OpenCV (cv2) and system ffmpeg
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY backend/ /app/

# Copy the compiled React frontend assets to the path expected by the backend
COPY frontend/dist/ /frontend/dist/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
