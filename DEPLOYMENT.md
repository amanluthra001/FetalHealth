# PregnaCare Live Deployment Guide

PregnaCare consists of three services plus a database:

1. **Frontend** (React / Create React App at repo root) → **Vercel**
2. **Node.js API** (`src/pregnancy-monitor-backend/server.js`) → **Railway** or **Render**
3. **Python ML Service** (`src/pregnancy-monitor-backend/main.py`, FastAPI + PyTorch Attention U-Net + scikit-learn) → **Railway** or **Hugging Face Spaces (Docker)**
4. **Database** (MongoDB) → **MongoDB Atlas** (Free M0 cluster)

> **Important RAM Note for the ML Service:** `best_attention_unet_resnet34.pth` (~98 MB) + PyTorch + OpenCV requires ~1–1.5 GB RAM at runtime. Render's free web service tier (512 MB RAM) will likely run out of memory; use **Railway** or a free **Hugging Face Docker Space** (16 GB RAM) for the Python ML service.

---

## 100% Free Plan Deployment (No Credit Card Required)

Because Railway's free trial expires and PyTorch + Attention U-Net needs >1 GB RAM (more than Render's 512 MB free tier), the best **100% free** stack is:

- **Database:** **MongoDB Atlas** (Free M0, 512 MB, no card) → https://cloud.mongodb.com
- **Backend + ML (Combined):** **Hugging Face Spaces** (Free Docker Space with **16 GB RAM**, no card) → https://huggingface.co/new-space
- **Frontend:** **Vercel** (Free Hobby tier, no card) → https://vercel.com/new

### Free Step A: Create MongoDB Atlas Database
1. Go to https://cloud.mongodb.com → create a free **M0** cluster.
2. Add a DB user + password, and under **Network Access** allow `0.0.0.0/0`.
3. Copy your `MONGO_URI` connection string.

### Free Step B: Deploy Backend + ML on Hugging Face Spaces (16 GB RAM Free)
1. Go to https://huggingface.co/new-space.
2. Choose **Docker** (Blank) as the Space SDK, **CPU basic · 2 vCPU · 16 GB (Free)**, and **Public**.
3. Upload these files from `src/pregnancy-monitor-backend/` into the Space (via Web UI or `git push`):
   - `Dockerfile` (runs both Node API on port `7860` and Python ML on `127.0.0.1:8000`)
   - `package.json`, `package-lock.json`, `server.js`
   - `requirements.txt`, `main.py`, `risk_model.pkl`, `best_attention_unet_resnet34.pth`
4. In Space **Settings → Variables and secrets**, add a **Secret**:
   - `MONGO_URI` = your MongoDB Atlas connection string
5. Once built, your live backend API URL is:
   `https://<your-hf-username>-<your-space-name>.hf.space`
   (Test `https://<your-hf-username>-<your-space-name>.hf.space/api/health`.)

### Free Step C: Deploy Frontend on Vercel
1. Go to https://vercel.com/new → import `amanluthra001/FetalHealth`.
2. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://<your-hf-username>-<your-space-name>.hf.space`
3. Click **Deploy**.

---

## Fast Railway Setup (Paid / Active Trial Only)

If you want the fastest deployment on Railway, `src/pregnancy-monitor-backend/Dockerfile` runs **both** the Express API (`node server.js` on `$PORT`) and FastAPI ML (`uvicorn main:app` on `127.0.0.1:8000`) inside a single service:

1. In Railway (`https://railway.com/new/github`), select `amanluthra001/FetalHealth`.
2. In **Service Settings** → **Root Directory**, set: `src/pregnancy-monitor-backend`
   *(Railway automatically detects `Dockerfile` in that directory.)*
3. Add a **MongoDB** database in the same Railway project (`+ New` → `Database` → `Add MongoDB`), OR use MongoDB Atlas below.
4. Set environment variables on the backend service:
   - `MONGO_URI` = `${{MongoDB.MONGO_URL}}` (if using Railway MongoDB) or your MongoDB Atlas URI
   - `CORS_ORIGINS` = your Vercel URL (once deployed)
5. Under **Settings → Networking**, click **Generate Domain** to get your backend URL (e.g. `https://<service>.up.railway.app`).

---

## Step 1: Set Up MongoDB Atlas (Free Alternative)

1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and password.
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) so your cloud backend can connect.
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/PregnaCare_db?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy the Python ML Service

### Option A: Railway (with `Dockerfile.ml`)
1. Create a new Railway project → **Deploy from GitHub repo** (`amanluthra001/FetalHealth`).
2. In Service Settings:
   - **Root Directory:** `src/pregnancy-monitor-backend`
   - **Dockerfile Path:** `Dockerfile.ml`
3. Generate a public domain (or note its internal Railway private URL, e.g. `http://ml-service.railway.internal:8000`).
4. Verify health check at `https://<your-ml-url>/health`.

### Option B: Hugging Face Spaces (Free 16 GB RAM)
1. Create a new **Docker** Space on Hugging Face.
2. Upload `main.py`, `requirements.txt`, `risk_model.pkl`, `best_attention_unet_resnet34.pth`, and `Dockerfile.ml` (renamed to `Dockerfile`).
3. Set `PORT=7860` (or add `app_port: 8000` in the Space `README.md` YAML header).
4. Copy your Space direct URL (e.g. `https://<user>-<space>.hf.space`).

---

## Step 3: Deploy the Node.js Backend (Railway or Render)

1. Create a new Web Service pointing to your GitHub repo:
   - **Root Directory:** `src/pregnancy-monitor-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - *(Or deploy using `Dockerfile.node`)*
2. Set the following **Environment Variables**:
   - `MONGO_URI` = your MongoDB Atlas connection string from Step 1
   - `ML_API_URL` = your deployed Python ML URL from Step 2 (no trailing slash)
   - `CORS_ORIGINS` = your Vercel frontend URL (you can add/update this after Step 4)
3. Verify health check at `https://<your-backend-url>/api/health`.

---

## Step 4: Deploy the Frontend (Vercel)

1. Go to [Vercel](https://vercel.com) → **Add New Project** → import `amanluthra001/FetalHealth` (or run `vercel --prod` from the repo root).
2. Keep **Framework Preset** as `Create React App` and **Root Directory** as `./`.
3. Add **Environment Variable**:
   - `REACT_APP_API_URL` = `https://<your-backend-url>` (from Step 3, no trailing slash)
4. Deploy! (`vercel.json` is already configured so React Router routes work on refresh.)
5. Go back to your Node.js Backend environment variables and set `CORS_ORIGINS=https://<your-vercel-app>.vercel.app`.

---

## Optional: Clean Up Previously Committed Secrets/Artifacts

`src/pregnancy-monitor-backend/.env`, `node_modules/`, and `uploads/` were previously tracked in git before `.gitignore` was updated. To untrack them without deleting your local files:

```bash
git rm --cached src/pregnancy-monitor-backend/.env
git rm -r --cached src/pregnancy-monitor-backend/node_modules
git rm -r --cached src/pregnancy-monitor-backend/uploads
```
