# AI Forecast — Intelligent AI/ML Forecasting & Prediction Platform

A full-stack, modular platform designed for end-to-end data ingestion, exploratory analytics, machine learning model training, and time-series/predictive forecasting.

---

## 📁 Project Architecture

```text
AI-FORECAST/
├── frontend/             # React + Vite + Tailwind CSS dashboard
├── backend/              # Python + FastAPI REST API
├── datasets/             # Time-series and forecasting datasets repository
├── README.md             # Project documentation & setup instructions
└── .gitignore            # Git exclusion rules
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Git**

---

### Backend Setup (FastAPI)

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

3. Install minimal dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Access the API documentation & health check:
   - Health endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
   - Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Frontend Setup (React + Vite + Tailwind CSS)

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open in browser:
   - Local UI: [http://localhost:5173](http://localhost:5173)

---

## 📌 Milestones
- [x] **Milestone 1**: Clean full-stack project foundation (FastAPI backend + React Vite Tailwind dashboard)
- [ ] **Milestone 2**: Dataset ingestion, upload, and exploratory data summary
- [ ] **Milestone 3**: Baseline statistical and machine learning models
- [ ] **Milestone 4**: Interactive forecasting visualization and evaluation metrics
