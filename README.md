# Render Deployment Guide for Auto Talleres Romo

## Overview
This repository contains a FastAPI backend (with optional Vite‑built frontend) that manages appointment scheduling. The app is now ready to be deployed on **Render.com** with:
- **Port detection** using the `$PORT` environment variable.
- **Admin panel protection** via HTTP Basic Auth (username/password supplied as Render env vars).
- **Persistent storage** note (data lives in the container; see the *Persistence* section).

---

## 1️⃣ Prerequisites
1. **GitHub (or GitLab/Bitbucket) account** – Render pulls code from a Git repo.
2. **Render account** – sign‑up at https://render.com (free tier is sufficient).
3. **Node 20+** – only needed if you want to rebuild the frontend locally before pushing.

---

## 2️⃣ Repository Setup
1. **Create a remote repo** (e.g., `github.com/youruser/auto-talleres-romo`).
2. Push the current folder:
   ```bash
   cd C:/Users/autot/ZZ
   git init
   git add .
   git commit -m "Initial commit – ready for Render"
   git remote add origin https://github.com/youruser/auto-talleres-romo.git
   git branch -M main
   git push -u origin main
   ```

---

## 3️⃣ Render Service Creation
1. In the Render dashboard click **"New Web Service"**.
2. **Connect the Git repo** you just created.
3. **Environment** → select **Docker** (Render will build the `Dockerfile` in the root).
4. **Build Command** – leave blank (Docker will handle it).
5. **Start Command** – leave blank (the Dockerfile’s `CMD` runs `uvicorn`).
6. **Port** – Render automatically passes the `$PORT` variable; our Dockerfile listens on it.
7. **Instance Type** – choose the free tier (256 MiB RAM, 0.5 CPU). This is enough for a low‑traffic demo.
8. **Environment Variables** – add two entries:
   - `ADMIN_USERNAME` – the username you want for the admin UI (e.g., `admin`).
   - `ADMIN_PASSWORD` – a strong password (e.g., `StrongPass123!`).
   You can also add any other settings required by `utils.ai` (OpenAI key, Gemini key, etc.).
9. Click **Create Web Service**.

Render will now:
- Build the Docker image (`docker build .`).
- Push the image to its registry.
- Deploy a container, exposing the `$PORT` it receives.

---

## 4️⃣ Verifying the Deployment
After the first build finishes (a few minutes), open the provided URL, e.g., `https://auto-talleres-romo.onrender.com`.
- **Health endpoint**: `GET /api/health` should return `{ "status": "ok" }`.
- **Admin UI**: navigate to `/admin`. The browser will prompt for Basic Auth – use the credentials you set in the env vars.
- **API**: all other routes (`/api/appointments`, `/api/available-dates`, …) work without authentication.

---

## 5️⃣ Persistence (Optional)
The current implementation stores appointments in a JSON file inside the container (`backend/appointments.json`). When the container restarts, this file is lost. For production you may want a persistent store:
- **External database** (PostgreSQL, SQLite on a volume, etc.).
- **Render’s Managed Postgres** – add it as a service and update `utils/scheduling.py` to read/write from the DB.
- **Object storage** (AWS S3, Google Cloud Storage) – write the JSON file there.

The code is modular; swapping the storage layer only requires updating the helper functions in `utils/scheduling.py`.

---

## 6️⃣ Re‑building the Frontend (If you change it)
If you modify anything under `frontend/`:
```bash
cd C:/Users/autot/ZZ/frontend
npm install   # only the first time
npm run build   # generates the `dist/` folder
```
Commit the new `frontend/dist/` directory and push – Render’s Dockerfile copies it automatically.

---

## 7️⃣ Troubleshooting
| Issue | Check |
|-------|-------|
| **500 / Server error** | Look at Render logs (`Logs` tab). Ensure env vars are set and the container started without crashes. |
| **Admin UI shows “Not authorized”** | Verify `ADMIN_USERNAME` / `ADMIN_PASSWORD` values and that they match the Basic Auth prompt. |
| **Appointments not persisting** | Remember the container’s filesystem is ephemeral. Use a DB or external storage as described above. |
| **CORS errors** | The API already enables `allow_origins=['*']`. If you restrict origins, update the CORS middleware accordingly. |

---

## 8️⃣ Next Steps (Optional Enhancements)
- Add **Rate Limiting** on the admin routes.
- Store **settings** in a secret manager (Render Secrets) instead of plain env vars.
- Implement **WebSocket** security (auth on the WS endpoint) if you expose it publicly.

---

You now have a fully functional, password‑protected admin panel running on Render. Happy deploying! 🎉
