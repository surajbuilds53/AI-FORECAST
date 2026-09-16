import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import mean_squared_error
from fastapi import HTTPException, status
from app.schemas.forecast import (
    ForecastRequest,
    HistoricalPoint,
    ForecastPoint,
    ForecastSummary,
    ForecastResponse,
)
from app.ml.training_service import MODELS_DIR
from app.services.dataset_service import DATASETS_DIR

# Z-score quantiles for common confidence levels
Z_MAP = {
    0.80: 1.282,
    0.85: 1.440,
    0.90: 1.645,
    0.95: 1.960,
    0.99: 2.576,
}


def get_z_score(confidence: float) -> float:
    closest_conf = min(Z_MAP.keys(), key=lambda c: abs(c - confidence))
    return Z_MAP[closest_conf]


def generate_future_forecast(request: ForecastRequest) -> ForecastResponse:
    """
    Executes real recursive multi-step future forecasting:
    1. Loads trained Scikit-learn estimator artifact and training metadata
    2. Ingests source dataset and ensures chronological ordering
    3. Iteratively computes calendar features and updates lag/rolling features
       by recursively feeding back previous predictions into future time steps
    4. Calculates compounding empirical prediction intervals based on validation RMSE
    5. Formulates seamless historical tail + future prediction points for visual continuity
    """
    clean_id = os.path.basename(request.model_id).replace(".joblib", "").replace(".json", "")
    joblib_path = MODELS_DIR / f"{clean_id}.joblib"
    meta_path = MODELS_DIR / f"{clean_id}.json"

    if not joblib_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trained model artifact '{request.model_id}' not found. Please train a model first.",
        )

    try:
        artifact = joblib.load(joblib_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load serialized model artifact: {str(e)}",
        )

    # Read training metadata if available
    metadata = {}
    if meta_path.exists():
        try:
            with open(meta_path, "r") as f:
                metadata = json.load(f)
        except Exception:
            pass

    estimator = artifact["estimator"]
    features_used: List[str] = artifact.get("features_used", [])
    target_col: str = artifact.get("target_column", "target")
    date_col: str = artifact.get("date_column", "date")
    model_name: str = artifact.get("model_name", "Trained Model")
    model_type: str = artifact.get("model_type", "regression")

    # Calculate base validation RMSE for uncertainty modeling
    y_val_true = artifact.get("y_val_true", [])
    y_val_pred = artifact.get("y_val_pred", [])
    if len(y_val_true) > 0 and len(y_val_pred) > 0:
        base_rmse = float(np.sqrt(mean_squared_error(y_val_true, y_val_pred)))
    else:
        base_rmse = 1.0

    # Locate source dataset
    dataset_name = request.dataset_id or metadata.get("dataset_id", "sample_sales.csv")
    clean_ds = os.path.basename(dataset_name)
    base_ds = clean_ds.replace(".csv", "").replace("_preprocessed", "")

    preprocessed_path = DATASETS_DIR / f"{base_ds}_preprocessed.csv"
    raw_path = DATASETS_DIR / f"{base_ds}.csv"

    if preprocessed_path.exists():
        ds_file = preprocessed_path
    elif raw_path.exists():
        ds_file = raw_path
    else:
        # Fallback to any existing csv in DATASETS_DIR
        csv_candidates = list(DATASETS_DIR.glob("*.csv"))
        if csv_candidates:
            ds_file = csv_candidates[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No dataset available to generate future forecasts. Please upload or load a sample dataset.",
            )

    try:
        df = pd.read_csv(ds_file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset: {str(e)}",
        )

    if date_col not in df.columns:
        for c in df.columns:
            if any(k in c.lower() for k in ["date", "time", "day", "timestamp"]):
                date_col = c
                break
        if date_col not in df.columns:
            date_col = df.columns[0]

    if target_col not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target column '{target_col}' not found in dataset.",
        )

    # Parse and sort chronologically
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
    df = df.dropna(subset=[date_col, target_col]).sort_values(by=date_col, ascending=True).reset_index(drop=True)

    if len(df) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset contains no valid observations for forecasting.",
        )

    # Determine time-step frequency (e.g. daily)
    if len(df) >= 2:
        step_delta = df[date_col].iloc[-1] - df[date_col].iloc[-2]
        if step_delta <= pd.Timedelta(0) or pd.isna(step_delta):
            step_delta = pd.Timedelta(days=1)
    else:
        step_delta = pd.Timedelta(days=1)

    # Prepare recursive forecasting buffer
    y_history: List[float] = list(df[target_col].astype(float).values)
    last_date: pd.Timestamp = df[date_col].iloc[-1]
    last_row_dict = df.iloc[-1].to_dict()
    is_non_negative = (df[target_col] >= 0).all()

    z = get_z_score(request.confidence_level)
    forecast_points: List[ForecastPoint] = []
    horizon = request.forecast_horizon

    # AUTOREGRESSIVE RECURSIVE MULTI-STEP FORECASTING LOOP
    for step in range(1, horizon + 1):
        future_dt = last_date + (step * step_delta)
        date_str = future_dt.strftime("%Y-%m-%d")

        # Dynamically construct features required by the trained estimator
        feat_dict = {}
        for feat in features_used:
            feat_lower = feat.lower()
            if feat_lower.endswith("_year") or feat_lower == "year":
                feat_dict[feat] = future_dt.year
            elif feat_lower.endswith("_month") or feat_lower == "month":
                feat_dict[feat] = future_dt.month
            elif feat_lower.endswith("_day") or feat_lower == "day":
                feat_dict[feat] = future_dt.day
            elif feat_lower.endswith("_dayofweek") or feat_lower == "dayofweek":
                feat_dict[feat] = future_dt.dayofweek
            elif feat_lower.endswith("_quarter") or feat_lower == "quarter":
                feat_dict[feat] = future_dt.quarter
            elif feat_lower.endswith("_is_weekend") or feat_lower == "is_weekend":
                feat_dict[feat] = 1 if future_dt.dayofweek in [5, 6] else 0
            elif "sin_day" in feat_lower:
                feat_dict[feat] = float(np.sin(2 * np.pi * future_dt.dayofweek / 7))
            elif "cos_day" in feat_lower:
                feat_dict[feat] = float(np.cos(2 * np.pi * future_dt.dayofweek / 7))
            elif feat_lower == "time_step":
                feat_dict[feat] = len(y_history)
            elif "lag_1" in feat_lower:
                feat_dict[feat] = y_history[-1]
            elif "lag_7" in feat_lower:
                feat_dict[feat] = y_history[-7] if len(y_history) >= 7 else y_history[0]
            elif "rolling_mean_7" in feat_lower or "rolling_mean" in feat_lower:
                feat_dict[feat] = float(np.mean(y_history[-7:]))
            elif feat in last_row_dict and pd.notna(last_row_dict[feat]):
                feat_dict[feat] = last_row_dict[feat]
            else:
                feat_dict[feat] = 0.0

        # Construct single-row prediction vector
        X_future = pd.DataFrame([feat_dict])[features_used].fillna(0)
        raw_pred = float(estimator.predict(X_future)[0])

        if is_non_negative:
            pred_val = max(0.0, raw_pred)
        else:
            pred_val = raw_pred

        # RECURSIVE FEEDBACK: Append prediction to history for subsequent steps
        y_history.append(pred_val)

        # Compounding uncertainty model: error accumulates as forecast horizon extends
        # sigma(h) = RMSE * sqrt(1 + 0.10 * (step - 1))
        step_sigma = base_rmse * np.sqrt(1.0 + 0.10 * (step - 1))
        lower_bound = max(0.0, pred_val - (z * step_sigma)) if is_non_negative else (pred_val - (z * step_sigma))
        upper_bound = pred_val + (z * step_sigma)

        forecast_points.append(
            ForecastPoint(
                date=date_str,
                predicted=float(round(pred_val, 2)),
                lower_bound=float(round(lower_bound, 2)),
                upper_bound=float(round(upper_bound, 2)),
                step=step,
            )
        )

    # Extract historical trailing tail (last 30 observations for chart continuity)
    tail_len = min(30, len(df))
    df_tail = df.iloc[-tail_len:]
    historical_points: List[HistoricalPoint] = [
        HistoricalPoint(
            date=row[date_col].strftime("%Y-%m-%d"),
            actual=float(round(row[target_col], 2)),
        )
        for _, row in df_tail.iterrows()
    ]

    # Compute summary statistics
    last_historical_val = float(round(df[target_col].iloc[-1], 2))
    all_preds = [p.predicted for p in forecast_points]
    mean_forecast = float(round(np.mean(all_preds), 2))
    min_forecast = float(round(np.min(all_preds), 2))
    max_forecast = float(round(np.max(all_preds), 2))

    if last_historical_val != 0:
        pct_change = float(round(((all_preds[-1] - last_historical_val) / last_historical_val) * 100, 2))
    else:
        pct_change = 0.0

    if pct_change > 1.5:
        trend_direction = "Upward Expansion"
    elif pct_change < -1.5:
        trend_direction = "Downward Contraction"
    else:
        trend_direction = "Neutral / Stable"

    viva_explanation = (
        f"Generated recursive multi-step forecasting for {horizon} intervals into the future using '{model_name}'. "
        f"At each future step t, engineered calendar signals and predicted target values were dynamically fed "
        f"back into lag features (t-1, t-7, and 7-day rolling averages). Prediction intervals at the {int(request.confidence_level * 100)}% "
        f"confidence level are derived from validation RMSE ({round(base_rmse, 2)}) with parametric error accumulation "
        f"proportional to the forecast horizon step."
    )

    summary = ForecastSummary(
        horizon_days=horizon,
        mean_forecast=mean_forecast,
        min_forecast=min_forecast,
        max_forecast=max_forecast,
        last_historical_value=last_historical_val,
        trend_direction=trend_direction,
        pct_change_from_last=pct_change,
        confidence_level_pct=int(request.confidence_level * 100),
        viva_explanation=viva_explanation,
    )

    return ForecastResponse(
        model_id=clean_id,
        model_name=model_name,
        model_type=model_type,
        target_column=target_col,
        date_column=date_col,
        forecast_horizon=horizon,
        confidence_level=request.confidence_level,
        historical_points=historical_points,
        forecast_points=forecast_points,
        summary=summary,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
