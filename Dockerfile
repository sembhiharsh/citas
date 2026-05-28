FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN ./node_modules/.bin/vite build

FROM python:3.10-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    ffmpeg && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
# Added comment to trigger rebuild after adding requests dependency
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ /app/
COPY --from=frontend-builder /frontend/dist/ /frontend/dist/
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
