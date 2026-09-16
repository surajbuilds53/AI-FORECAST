# AI Forecast — BTech 5th-Semester Viva Preparation & Defense Guide

This document is the official academic defense cheat sheet for the **AI Forecast: Intelligent AI/ML Forecasting Platform**. It contains the exact technical rationale, mathematical formulas, examiner questions, and model answers required for scoring highest marks in university viva evaluations.

---

## 📑 Table of Contents
1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [Critical Machine Learning Concepts for Viva](#2-critical-machine-learning-concepts-for-viva)
3. [Top Examiner Questions & Model Answers](#3-top-examiner-questions--model-answers)
4. [Mathematical Formulations](#4-mathematical-formulations)
5. [Step-by-Step 5-Minute Live Project Demonstration Script](#5-step-by-step-5-minute-live-project-demonstration-script)
6. [Software Architecture & Engineering Rationale](#6-software-architecture--engineering-rationale)

---

## 1. Project Overview & Problem Statement

### What is AI Forecast?
**AI Forecast** is an end-to-end Machine Learning web platform that ingests raw time-stamped datasets, performs automated validation and preprocessing, engineers temporal and cyclic features, trains Scikit-learn regression models on strict chronological partitions, evaluates generalization using standard statistical error metrics, and produces recursive multi-step future forecasts with empirical prediction intervals.

### Why is this project significant?
Standard academic projects often display hardcoded forecasts or apply standard cross-validation without understanding the temporal dimension of data. **AI Forecast** solves the fundamental problem of **temporal data leakage** by strictly maintaining the chronological timeline across data cleaning, feature creation, validation splitting, and recursive inference.

---

## 2. Critical Machine Learning Concepts for Viva

### Concept 1: Temporal Data Leakage vs. Chronological Splitting
- **The Problem with Random K-Fold CV**: If data points are shuffled randomly, the training set will contain future observations (e.g., day $t+5$), and the model will be evaluated on past observations (e.g., day $t+1$). This creates **look-ahead bias** (temporal leakage), inflating validation accuracy while producing catastrophic failure in real-world deployment.
- **Our Solution**: We enforce `shuffle=False` and split strictly by timestamp:
  - **Training Set (80%)**: The earliest continuous chronological observations (e.g., Days 1 to 96).
  - **Validation Set (20%)**: The subsequent continuous observations (e.g., Days 97 to 121).

### Concept 2: Feature Engineering for Time-Series
Since tabular regression algorithms (such as Ordinary Least Squares or Random Forests) do not possess internal recurrence like LSTMs or RNNs, temporal structure must be explicitly encoded into the feature matrix:
1. **Calendar Cyclic Features**:
   - `dayofweek`, `month`, `quarter`, `is_weekend`.
   - Cyclic sine/cosine encoding: $\sin(2\pi \cdot \text{day} / 7)$ and $\cos(2\pi \cdot \text{day} / 7)$ preserves the continuous circular relationship between Sunday and Monday.
2. **Autoregressive Lag Features**:
   - `lag_1` ($y_{t-1}$): The immediately preceding observation (captures short-term momentum).
   - `lag_7` ($y_{t-7}$): The observation from 7 periods prior (captures weekly seasonal repetition).
3. **Rolling Moving Average**:
   - `rolling_mean_7` ($\frac{1}{7}\sum_{i=1}^{7} y_{t-i}$): Smoothes high-frequency noise and supplies the macro trend direction.

### Concept 3: Multi-Step Autoregressive Recursive Forecasting
- When forecasting into the unseen future ($t+1, t+2, \dots, t+H$), ground-truth target values for lag features are not available.
- **Recursive Process**:
  1. For step $t+1$: Compute calendar features, feed $y_t$ into `lag_1`, and predict $\hat{y}_{t+1}$.
  2. For step $t+2$: Update calendar features, feed the **predicted** $\hat{y}_{t+1}$ into `lag_1`, and predict $\hat{y}_{t+2}$.
  3. Repeat dynamically up to horizon $H$.

### Concept 4: Empirical Prediction Intervals (Uncertainty Propagation)
- Scikit-learn deterministic models do not output Bayesian probability distributions.
- We model uncertainty using the out-of-sample validation Root Mean Squared Error ($\text{RMSE}_{\text{val}}$).
- Because prediction errors compound over time in recursive forecasting, standard error widens with the step index $h$:
  $$\sigma(h) = \text{RMSE}_{\text{val}} \times \sqrt{1 + \alpha \cdot (h - 1)} \quad (\text{with } \alpha = 0.10)$$
- Bounds for confidence level $z$:
  $$\text{Upper}_h = \hat{y}_h + z \cdot \sigma(h), \quad \text{Lower}_h = \max(0, \hat{y}_h - z \cdot \sigma(h))$$

---

## 3. Top Examiner Questions & Model Answers

### Q1: "Why did you choose Linear Regression and Random Forest instead of ARIMA or LSTM?"
> **Model Answer**:
> "Sir/Madam, we selected Linear Regression as an essential **interpretability baseline** and Random Forest Regressor as a non-linear ensemble algorithm. 
> 1. Linear Regression allows us to evaluate whether a linear trend exists and gives clear coefficient weights with sub-millisecond execution time.
> 2. Random Forest Regressor captures non-linear seasonal interactions, holiday effects, and threshold behaviors without requiring the data to be strictly stationary (unlike traditional ARIMA, which fails when variance or seasonality changes over time).
> 3. While deep learning models like LSTM require tens of thousands of continuous time-steps to avoid severe overfitting, Random Forest performs exceptionally well on small to medium-sized business datasets (100 to 5,000 observations) using bootstrap aggregation and random feature sub-spacing."

### Q2: "Why do we use RMSE alongside MAE? What is the difference?"
> **Model Answer**:
> "MAE (Mean Absolute Error) measures the average magnitude of absolute errors in linear target units: $\frac{1}{n}\sum |y - \hat{y}|$. It treats all deviations equally.
> RMSE (Root Mean Squared Error) squares the errors before taking the root: $\sqrt{\frac{1}{n}\sum (y - \hat{y})^2}$. Because errors are squared, **RMSE heavily penalizes large individual forecast errors**.
> In forecasting applications like supply chain or sales, small deviations are tolerable, but large catastrophic spikes lead to stockouts. Therefore, RMSE is our primary ranking metric on the held-out validation split."

### Q3: "What does an $R^2$ score represent in time series? Can it be negative?"
> **Model Answer**:
> "$R^2$ (Coefficient of Determination) represents the proportion of target variance explained by the model's features: $1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}$. 
> An $R^2$ of 1.0 means perfect prediction.
> Yes, on an out-of-sample validation partition, **$R^2$ can be negative** if the model's residual sum of squares exceeds the total variance of the data—meaning the model predicts worse than simply guessing the historical horizontal mean line $\bar{y}$. This is a crucial diagnostic for overfitting."

### Q4: "How do you handle missing timestamps or null values in your preprocessing pipeline?"
> **Model Answer**:
> "In our preprocessing service:
> 1. Datetimes are parsed and verified using ISO standards.
> 2. Observations are sorted strictly ascending by timestamp.
> 3. For missing numeric values, we offer multiple strategies:
>    - **Forward Fill (`ffill`)**: Propagates the last known valid observation forward (statistically optimal for time-series persistence).
>    - **Backward Fill (`bfill`)**: Propagates the next known observation backward.
>    - **Mean / Median Imputation**: Replaces nulls with central tendency metrics.
>    - **Row Dropping**: Eliminates rows with missing target values."

### Q5: "How does your system serialize trained models?"
> **Model Answer**:
> "We use Python's `joblib` library to serialize the fitted estimator, feature column names, validation dates, and true vs. predicted validation arrays into a `.joblib` binary artifact in `backend/app/ml/saved_models/`. Concurrently, we write a corresponding `.json` metadata file containing hyperparameters, training duration in milliseconds, and date ranges. This allows the backend to perform instant inference and evaluation without retraining."

---

## 4. Mathematical Formulations

| Metric / Term | Mathematical Formula | Units / Meaning |
| :--- | :---: | :--- |
| **Mean Absolute Error (MAE)** | $\text{MAE} = \frac{1}{n}\sum_{i=1}^{n} \|y_i - \hat{y}_i\|$ | Target units; average linear error |
| **Mean Squared Error (MSE)** | $\text{MSE} = \frac{1}{n}\sum_{i=1}^{n} (y_i - \hat{y}_i)^2$ | Squared units; quadratic error penalty |
| **Root Mean Squared Error (RMSE)** | $\text{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^{n} (y_i - \hat{y}_i)^2}$ | Target units; standard deviation of residuals |
| **Coefficient of Determination ($R^2$)** | $R^2 = 1 - \frac{\sum_{i=1}^n (y_i - \hat{y}_i)^2}{\sum_{i=1}^n (y_i - \bar{y})^2}$ | Dimensionless ($-\infty$ to $1.0$); variance explained |
| **Compounding Forecast Uncertainty** | $\sigma(h) = \text{RMSE} \times \sqrt{1 + 0.1(h-1)}$ | Target units; expanding uncertainty envelope |
| **Prediction Interval Bounds** | $[\max(0, \hat{y}_h - z\sigma(h)), \; \hat{y}_h + z\sigma(h)]$ | $z = 1.96$ for 95% CI; $z = 1.28$ for 80% CI |

---

## 5. Step-by-Step 5-Minute Live Project Demonstration Script

Follow this sequence during your project demonstration:

1. **Step 1: Dashboard Overview**
   - Point out the active telemetry cards: Dataset status, Model status, Forecast status, and FastAPI backend online badge.
   - Mention the version: `v1.0.0 Production Ready`.
2. **Step 2: Datasets & Ingestion**
   - Navigate to **Datasets**. Click **"Load Sample Sales Dataset"** (or upload a custom CSV).
   - Show the detected column profiling (Datetime, Numeric, Categorical) and the 120-day historical table.
3. **Step 3: Preprocessing & Feature Engineering**
   - Navigate to **Preprocessing**. Explain chronological sorting and feature engineering.
   - Click **"Execute Preprocessing Pipeline"**. Show the viva audit log and the newly created `lag_1`, `lag_7`, and `rolling_mean_7` columns.
4. **Step 4: Analytics & Trend Analysis**
   - Navigate to **Analytics**. Show the interactive Recharts time series.
   - Demonstrate the moving average window switcher (7-day vs 14-day) and the least-squares linear trendline ($y = mx + c$).
5. **Step 5: Model Training with Chronological Split**
   - Navigate to **Models**. Explain that the timeline is split strictly chronologically (80% Train, 20% Validation) with zero shuffling to prevent data leakage.
   - Train **Linear Regression** (takes ~15ms).
   - Train **Random Forest Regressor** (takes ~60ms).
6. **Step 6: Model Evaluation & Leaderboard**
   - Navigate to **Evaluation**.
   - Show the **Top Performer Recommendation Banner** highlighting the model with lowest RMSE.
   - Show the **Comparative Leaderboard** and the **Actual vs. Predicted Validation Curve**.
7. **Step 7: Multi-Step Future Forecasting & CSV Export**
   - Navigate to **Forecasts**.
   - Select **14 Days** and **95% Confidence Interval**.
   - Click **"Recompute Forecast"**. Show the seamless transition from historical actuals into the dashed future projection with expanding uncertainty bands.
   - Click **"Export Forecast CSV"** to demonstrate downloadable artifacts.
8. **Step 8: Viva & Architecture Hub**
   - Navigate to **Viva & Docs** tab to show the examiner the in-app architectural diagrams, mathematical formulations, and viva Q&A cards!

---

## 6. Software Architecture & Engineering Rationale

- **FastAPI Backend**: Built on ASGI (`Starlette` and `Uvicorn`). Handles high-throughput asynchronous requests with auto-generated OpenAPI documentation at `/docs`.
- **Modularity**:
  - `schemas/`: Strong Pydantic type validation for all payloads.
  - `services/`: Pure business and ML computation isolated from routing logic.
  - `api/`: RESTful HTTP routers with clean separation of concerns.
- **Scikit-learn Pipeline**: Standardized numerical feature extraction, zero synthetic interpolation, and strict validation isolation.
- **Frontend Stack**: React 18 + Vite 6 + Tailwind CSS + Recharts + Axios. Clean component architecture with unified responsive design and an application-level `ErrorBoundary`.
