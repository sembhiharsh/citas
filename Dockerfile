# ---- Dockerfile for CitaRomo (FastAPI) ----
FROM python:3.11-slim

# Install OS‑level build tools (needed for some py packages)
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Set a non‑root user (optional but good practice)
RUN useradd -m appuser
WORKDIR /app

# Copy only the dependency file first (caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the source code
COPY . .

# Expose the port Render will provide (ENV $PORT)
EXPOSE 8000

# Run the FastAPI app; Render injects $PORT, fallback to 8000
CMD ["sh","-c","uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
