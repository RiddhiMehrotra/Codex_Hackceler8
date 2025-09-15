# hack8r – Full-Stack Starter (React + Node + ML)

This repo matches the structure you specified and includes:
- React (Vite + Tailwind) frontend
- Node.js backend (Express, Mongo/Postgres-ready)
- Python ML (IsolationForest) that trains on the CSV datasets placed in `ml/data/`

## Quick Start

### 1) Start databases (optional for MVP)
```bash
docker compose up -d mongo postgres
```

### 2) Train the ML model (uses CSVs in `ml/data`)
```bash
cd ml
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python train_model.py
```
This will create `ml/artifacts/model_iforest.joblib`.

### 3) Backend (Node.js)
```bash
cd ../backend
npm install
npm start
```
Endpoints:
- `POST /api/predict` → body with numeric fields; returns anomaly prediction using Python `ml/predict.py`
- `GET /api/sensors/mock` → returns a mock reading to feed the UI

### 4) Frontend (React + Vite + Tailwind)
```bash
cd ../frontend
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173). Login page is mocked; Dashboard hits backend.

## Datasets included
dataset_1.csv, dataset_2.csv, dataset_3.csv

Good luck at the hackathon! 🎉
