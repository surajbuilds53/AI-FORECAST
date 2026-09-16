# AI-FORECAST: Complete Team Study & Onboarding Guide

Welcome to the **AI-FORECAST** project! This guide is designed so that any team member can quickly understand the system architecture, how the frontend and backend interact, how the machine learning pipeline works, and how to explain or demonstrate the application with confidence.

---

## 📑 Quick Navigation
1. [Project in 60 Seconds](#1-project-in-60-seconds)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Folder Structure (Where Code Lives)](#3-folder-structure)
4. [Step-by-Step Data Flow (From CSV to Forecast)](#4-step-by-step-data-flow)
5. [App Pages & Features Walkthrough](#5-app-pages--features-walkthrough)
6. [Core Machine Learning Concepts (Viva Essentials)](#6-core-machine-learning-concepts)
7. [How to Run & Develop Locally](#7-how-to-run--develop-locally)
8. [Team Member Presentation / Defense Roles](#8-team-presentation-roles)

---

## 1. Project in 60 Seconds

### What is AI-FORECAST?
**AI-FORECAST** is a full-stack time-series forecasting web application. It allows users to:
1. Upload or load a historical time-series dataset (e.g., daily sales, website visits, energy demand).
2. Automatically clean data, impute missing values, and engineer temporal features (lags, rolling averages, calendar attributes).
3. Train two complementary machine learning models:
   - **Linear Regression** (interpretable statistical baseline)
   - **Random Forest Regressor** (non-linear decision tree ensemble)
4. Compare models using out-of-sample statistical metrics (**MAE**, **RMSE**, **R²**).
5. Generate recursive multi-step future forecasts (7, 14, or 30 days ahead) with empirical confidence intervals (80%, 95%, 99%) and export results to CSV.

### What makes it special?
Unlike toy machine learning projects that randomly shuffle data (which causes **temporal data leakage**), this platform strictly enforces **chronological splitting** (`shuffle=False`), uses true **recursive autoregression** for future prediction, and dynamically calculates **expanding uncertainty bounds**.

---

## 2. High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    REACT 18 + VITE FRONTEND                 │
│  Tailwind CSS • Recharts Charts • Lucide Icons • Light UI   │
│  (Port: http://localhost:5173)                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST Calls (Axios)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI PYTHON BACKEND                  │
│  Pydantic Validation • CORS Middleware • Uvicorn Server     │
│  (Port: http://127.0.0.1:8000  |  Docs: /docs)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌─────────────────────────┐
│   DATA & PREPROCESSING       │    │     SCIKIT-LEARN ML     │
│  • Pandas / NumPy            │    │  • Linear Regression    │
│  • Chronological validation  │    │  • Random Forest        │
│  • Lag (t-1, t-7) & Rolling  │    │  • Recursive Forecaster │
│  • Imputation (ffill, mean)  │    │  • Joblib Serialization │
└──────────────────────────────┘    └─────────────────────────┘
```

---

## 3. Folder Structure

```text
AI-FORECAST/
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI router endpoints
│   │   │   ├── analytics.py    # Time-series summary statistics & moving averages
│   │   │   ├── datasets.py     # CSV upload, sample data, column inspection
│   │   │   ├── evaluation.py   # Model benchmark leaderboard & validation curve
│   │   │   ├── forecast.py     # Future prediction generator & CSV export
│   │   │   ├── health.py       # Health check API (/health)
│   │   │   ├── models.py       # Model training triggers & metadata
│   │   │   └── preprocessing.py# Cleaning & feature engineering
│   │   ├── ml/                 # Core Machine Learning logic
│   │   │   ├── data_pipeline.py# Lag creation, cyclic transforms, ffill
│   │   │   ├── evaluation.py   # MAE, MSE, RMSE, R² calculations
│   │   │   ├── forecaster.py   # Multi-step autoregressive recursive engine
│   │   │   ├── model_registry.py# Joblib model saving/loading
│   │   │   └── training_service.py # Model fitting and validation partition
│   │   ├── schemas/            # Pydantic request/response validation schemas
│   │   └── main.py             # FastAPI entry point & CORS configuration
│   ├── tests/                  # 26 automated unit & integration tests (Pytest)
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API call modules for each backend router
│   │   ├── charts/             # Recharts components
│   │   │   ├── ActualVsPredictedChart.jsx # Solid blue vs dashed green test curve
│   │   │   ├── ForecastChart.jsx          # Continuous history + forecast + bounds
│   │   │   └── TimeSeriesChart.jsx        # Historical data with moving averages
│   │   ├── components/         # Shared UI elements
│   │   │   ├── Header.jsx      # Top bar with API status badge and title
│   │   │   ├── Sidebar.jsx     # Navigation menu (240px width)
│   │   │   └── ErrorBoundary.jsx # React Error Boundary wrapper
│   │   ├── pages/              # Application views
│   │   │   ├── Dashboard.jsx   # Project status cards & workflow roadmap
│   │   │   ├── DatasetsPage.jsx# Dataset inspection & column target configuration
│   │   │   ├── PreprocessingPage.jsx # Imputation & feature engineering audit
│   │   │   ├── AnalyticsPage.jsx # Moving averages & summary metrics
│   │   │   ├── ModelsPage.jsx  # Model training & hyperparameter configuration
│   │   │   ├── EvaluationPage.jsx # MAE/RMSE leaderboard & residual analysis
│   │   │   ├── ForecastPage.jsx# Future predictions, confidence bands & CSV download
│   │   │   └── VivaGuidePage.jsx # Built-in viva examiner Q&A & formula reference
│   │   ├── App.jsx             # Root layout, tab routing & state management
│   │   └── index.css           # Clean light theme design system
│   └── package.json            # Node.js dependencies
```

---

## 4. Step-by-Step Data Flow

Here is how data travels from an uploaded file to a final forecast:

```text
1. RAW DATA (CSV)
   │  User uploads CSV or clicks "Load Sample Dataset" (120 daily rows).
   ▼
2. INGESTION & DATE PARSING
   │  Backend detects timestamp column and target numeric column (e.g., 'sales').
   │  Sorts rows chronologically and checks for null values.
   ▼
3. FEATURE ENGINEERING
   │  • Calendar features: day of week (0-6), month (1-12).
   │  • Autoregressive lag features: lag_1 (yesterday), lag_7 (same day last week).
   │  • Rolling features: rolling_mean_7 (7-day trend).
   ▼
4. CHRONOLOGICAL TRAIN/TEST SPLIT
   │  80% earliest rows -> Training Set (e.g. Rows 1–96).
   │  20% latest rows   -> Holdout Validation Test Set (e.g. Rows 97–120).
   │  *shuffle=False* is strictly used to eliminate temporal data leakage!
   ▼
5. MODEL TRAINING
   │  • Linear Regression: Fits ordinary least squares baseline line.
   │  • Random Forest: Fits 100 decision trees to capture non-linear patterns.
   │  Models are serialized to disk using Joblib.
   ▼
6. EVALUATION ON HOLDOUT SET
   │  Both models predict on the unseen 20% validation set.
   │  Calculates MAE, RMSE, and R². The model with the lowest RMSE is recommended.
   ▼
7. RECURSIVE FUTURE INFERENCE
   │  Ground truth future values do not exist!
   │  The model predicts step t+1, then feeds its own prediction back into lag_1
   │  to predict step t+2, repeating up to horizon H (e.g. 14 days).
   │  Confidence interval widens over time: σ(h) = RMSE * sqrt(1 + 0.1*(h-1)).
```

---

## 5. App Pages & Features Walkthrough

| # | Page | Main Purpose | Key Controls / Output |
|---|---|---|---|
| **1** | **Dashboard** | Mission control & project status | 4 status cards, 1-click sample dataset loader, 5-step workflow overview |
| **2** | **Datasets** | Data ingestion and target selection | Date column picker, target column picker, sticky preview table |
| **3** | **Preprocessing** | Data cleaning & feature engineering | Imputation selector (ffill, mean), lag toggles (`lag_1`, `lag_7`), audit log |
| **4** | **Analytics** | Exploratory time-series analysis | 7/14/30-day moving averages, Min/Max/Mean/Latest metric cards |
| **5** | **Models** | Model training & configuration | Radio cards for Linear Regression vs. Random Forest, trees/depth sliders, split bar |
| **6** | **Evaluation** | Holdout benchmarking | Comparison leaderboard, lowest RMSE recommendation, solid blue vs. dashed green chart |
| **7** | **Forecasts** | Out-of-sample future projections | 7/14/30-day horizon, 80/95/99% CI, continuous timeline chart, CSV export |
| **8** | **Viva & Docs** | Academic reference & exam prep | 6 examiner Q&A accordions, formula reference, live demo script |

---

## 6. Core Machine Learning Concepts (Viva Essentials)

### Q1: Why must we use chronological splitting instead of random K-Fold?
> **Answer:** In time series, data points have temporal auto-correlation. If you randomly shuffle data into K-folds, future observations ($t+5$) end up in the training set and past observations ($t+1$) in the test set. This creates **lookahead bias / temporal data leakage**, giving fake 99% accuracy in training but catastrophic failure in real-world deployment. We enforce `shuffle=False` (earliest 80% train, latest 20% test).

### Q2: What is the difference between Linear Regression and Random Forest here?
> **Answer:**
> - **Linear Regression**: Fast statistical baseline. Fits an ordinary least squares plane. Sub-millisecond training, perfectly interpretable coefficients, zero risk of tree overfitting.
> - **Random Forest**: Ensemble of randomized decision trees. Captures complex non-linear calendar seasonality, weekend multipliers, and holiday spikes without assuming linear relationships.

### Q3: Why compare with both MAE and RMSE? Why prioritize RMSE?
> **Answer:**
> - **MAE (Mean Absolute Error)**: $\frac{1}{n}\sum |y - \hat{y}|$. Measures average error linearly. Robust to outliers.
> - **RMSE (Root Mean Squared Error)**: $\sqrt{\frac{1}{n}\sum (y - \hat{y})^2}$. Squares errors before taking the root, heavily penalizing large blunders. In supply chain or sales forecasting, small errors are normal, but a massive demand spike miss causes stockouts. Therefore, RMSE is our primary ranking metric.

### Q4: What does a negative $R^2$ score mean?
> **Answer:** $R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}$. On an out-of-sample holdout test set, if a model overfits and its residual sum of squares exceeds the total variance of the actual data, $R^2$ becomes negative. This indicates the model performs worse than simply predicting the historical average ($\bar{y}$) for every point.

### Q5: How does the recursive forecasting engine work for future dates?
> **Answer:** Since ground-truth target values do not exist in the future:
> 1. For day $t+1$: Compute calendar features, pull the last known actual value into `lag_1`, and predict $\hat{y}_{t+1}$.
> 2. For day $t+2$: Update calendar features, feed $\hat{y}_{t+1}$ into `lag_1`, and predict $\hat{y}_{t+2}$.
> 3. Repeat step-by-step up to the full horizon $H$.

### Q6: Why do confidence intervals widen over time?
> **Answer:** Because future predictions feed back into subsequent lag inputs, uncertainty compounds. We model standard error dynamically:
> $$\sigma(h) = \text{RMSE}_{\text{val}} \times \sqrt{1 + 0.10 \times (h - 1)}$$
> As horizon step $h$ increases, $\sigma(h)$ grows, creating the realistic expanding uncertainty cone seen in professional forecasting.

---

## 7. How to Run & Develop Locally

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

### Step 1: Start the Backend (Terminal 1)
```powershell
cd backend
# Activate virtual environment:
.\.venv\Scripts\Activate.ps1
# (or on Unix: source .venv/bin/activate)

# Run FastAPI server:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API is live at: `http://127.0.0.1:8000`
- Interactive Swagger docs: `http://127.0.0.1:8000/docs`

### Step 2: Start the Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
- Frontend is live at: `http://localhost:5173`

### Step 3: Run Automated Tests
```powershell
cd backend
.\.venv\Scripts\python -m pytest
# All 26 tests should pass with 100% success rate!
```

---

## 8. Team Presentation Roles

If your team is presenting this project in a viva or demo, here is the recommended 3-person division:

### 👤 Member 1: System Overview, Architecture & Data Ingestion
- Explains the problem statement and the dangers of temporal data leakage.
- Shows the **Dashboard** and **Datasets** page.
- Explains FastAPI backend architecture and React frontend structure.

### 👤 Member 2: Preprocessing, Feature Engineering & Model Training
- Demonstrates **Preprocessing**: why we engineer `lag_1`, `lag_7`, and `rolling_mean_7`.
- Demonstrates **Models**: explains the 80/20 chronological split with `shuffle=False`.
- Explains Linear Regression vs. Random Forest hyperparameters.

### 👤 Member 3: Evaluation, Leaderboard & Future Forecasting
- Demonstrates **Evaluation**: explains MAE, RMSE, and $R^2$, and why the lowest RMSE model is recommended.
- Demonstrates **Forecasts**: generates the 14-day projection, explains recursive autoregression and expanding confidence intervals, and exports the CSV.
- Answers theoretical examiner questions using the built-in **Viva & Docs** tab.
