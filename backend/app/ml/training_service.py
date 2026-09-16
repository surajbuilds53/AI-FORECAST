import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from fastapi import HTTPException, status
from app.schemas.model import (
    TrainingRequest,
    ModelTrainingResult,
    AvailableModelInfo,
)
from app.services.dataset_service import DATASETS_DIR

MODELS_DIR = Path(__file__).resolve().parent / "saved_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

AVAILABLE_MODELS: Dict[str, AvailableModelInfo] = {
    "linear_regression": AvailableModelInfo(
        id="linear_regression",
        name="Linear Regression Baseline",
        category="Statistical Baseline",
        description="Fits a linear relationship between features and target. Fast, interpretable, and provides an essential baseline for college viva evaluation.",
        strengths=[
            "Instant training (< 20 ms)",
            "Direct coefficient interpretability",
            "Clear baseline benchmark for complex models"
        ],
        default_hyperparameters={"fit_intercept": True},
    ),
    "random_forest": AvailableModelInfo(
        id="random_forest",
        name="Random Forest Regressor",
        category="Non-Linear Ensemble Trees",
        description="Ensemble of decision trees trained on bootstrap samples. Excels at learning non-linear seasonality and feature interactions without overfitting.",
        strengths=[
            "Captures non-linear seasonal patterns",
            "Robust against extreme outliers",
            "Models complex feature interactions"
        ],
        default_hyperparameters={"n_estimators": 100, "max_depth": 10, "random_state": 42},
    ),
}


def get_available_models() -> List[AvailableModelInfo]:
    """Returns catalog of supported machine learning models."""
    return list(AVAILABLE_MODELS.values())


def list_trained_models() -> List[ModelTrainingResult]:
    """Lists all previously trained model runs stored on disk."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    results: List[ModelTrainingResult] = []

    for meta_path in MODELS_DIR.glob("*.json"):
        try:
            with open(meta_path, "r") as f:
                data = json.load(f)
                results.append(ModelTrainingResult(**data))
        except Exception:
            continue

    return sorted(results, key=lambda x: x.trained_at, reverse=True)


def get_trained_model_by_id(model_id: str) -> ModelTrainingResult:
    """Fetches details of a specific trained model by ID."""
    clean_id = os.path.basename(model_id).replace(".joblib", "").replace(".json", "")
    meta_path = MODELS_DIR / f"{clean_id}.json"

    if not meta_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model '{model_id}' not found.",
        )

    with open(meta_path, "r") as f:
        data = json.load(f)
    return ModelTrainingResult(**data)


def train_forecasting_model(request: TrainingRequest) -> ModelTrainingResult:
    """
    Executes the real ML training pipeline:
    1. Loads dataset and enforces chronological ordering
    2. Builds numeric feature matrix X and target y
    3. Strictly splits chronologically into Train (80%) and Validation (20%)
    4. Trains Scikit-learn estimator and measures execution duration
    5. Stores serialized model artifact, validation predictions, and metadata
    """
    clean_id = os.path.basename(request.dataset_id)
    base_name = clean_id.replace(".csv", "")

    # Check for preprocessed dataset first to leverage engineered lag & calendar features
    preprocessed_path = DATASETS_DIR / f"{base_name}_preprocessed.csv"
    raw_path = DATASETS_DIR / clean_id

    if preprocessed_path.exists():
        target_path = preprocessed_path
    elif raw_path.exists():
        target_path = raw_path
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{request.dataset_id}' not found.",
        )

    try:
        df = pd.read_csv(target_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset: {str(e)}",
        )

    target_col = request.target_column
    if target_col not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target column '{target_col}' not found in dataset.",
        )

    # Detect date column for chronological ordering and date range tags
    date_col = None
    for col in df.columns:
        if any(keyword in col.lower() for keyword in ["date", "time", "day", "timestamp"]):
            date_col = col
            break
    if not date_col:
        date_col = df.columns[0]

    try:
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        df = df.dropna(subset=[date_col]).sort_values(by=date_col, ascending=True).reset_index(drop=True)
    except Exception:
        pass

    # Ensure target is numeric
    try:
        df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
        df = df.dropna(subset=[target_col]).reset_index(drop=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target variable must be numeric: {str(e)}",
        )

    # Prepare feature matrix X
    y = df[target_col]

    if request.feature_columns and len(request.feature_columns) > 0:
        valid_cols = [c for c in request.feature_columns if c in df.columns and c != target_col]
        if not valid_cols:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="None of the specified feature columns are valid numeric features in the dataset.",
            )
        X = df[valid_cols]
    else:
        # Automatically select all numeric features excluding target
        X = df.select_dtypes(include=[np.number]).drop(columns=[target_col], errors="ignore")

    # If X is still empty, create an index trend feature
    if X.shape[1] == 0:
        X["time_step"] = np.arange(len(df))

    # Fill any residual NaNs with forward/backward fill
    X = X.ffill().bfill().fillna(0)
    features_used = list(X.columns)

    total_rows = len(df)
    if total_rows < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset must contain at least 10 rows for meaningful time-series train/validation splitting.",
        )

    # STRICT CHRONOLOGICAL TRAIN / VALIDATION SPLIT (NO SHUFFLING)
    split_ratio = max(0.10, min(request.test_split_ratio, 0.50))
    split_idx = int(total_rows * (1 - split_ratio))
    split_idx = max(5, min(split_idx, total_rows - 2))

    X_train, X_val = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_val = y.iloc[:split_idx], y.iloc[split_idx:]

    # Date range formatting for viva defense
    try:
        train_start = df[date_col].iloc[0].strftime("%Y-%m-%d")
        train_end = df[date_col].iloc[split_idx - 1].strftime("%Y-%m-%d")
        val_start = df[date_col].iloc[split_idx].strftime("%Y-%m-%d")
        val_end = df[date_col].iloc[-1].strftime("%Y-%m-%d")
        train_date_range = f"{train_start} to {train_end}"
        val_date_range = f"{val_start} to {val_end}"
        val_dates = [d.strftime("%Y-%m-%d") for d in df[date_col].iloc[split_idx:]]
    except Exception:
        train_date_range = f"Rows 1 to {split_idx}"
        val_date_range = f"Rows {split_idx + 1} to {total_rows}"
        val_dates = [f"Step_{i}" for i in range(split_idx + 1, total_rows + 1)]

    # Model Instantiation and Training
    model_type = request.model_type.lower()
    hyperparams = request.hyperparameters or {}

    if model_type == "linear_regression":
        model_name = "Linear Regression Baseline"
        estimator = LinearRegression(**hyperparams)
    elif model_type == "random_forest":
        model_name = "Random Forest Regressor"
        n_estimators = hyperparams.get("n_estimators", 100)
        max_depth = hyperparams.get("max_depth", 10)
        estimator = RandomForestRegressor(
            n_estimators=int(n_estimators),
            max_depth=int(max_depth) if max_depth else None,
            random_state=42,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported model type '{request.model_type}'. Choose 'linear_regression' or 'random_forest'.",
        )

    # Measure exact training execution duration
    t_start = time.perf_counter()
    estimator.fit(X_train, y_train)
    duration_ms = round((time.perf_counter() - t_start) * 1000, 2)

    # Predict on validation set
    y_val_pred = estimator.predict(X_val)

    # Generate unique model ID and persist artifact
    model_id = f"{model_type}_{str(uuid.uuid4())[:8]}"
    model_artifact = {
        "model_id": model_id,
        "model_name": model_name,
        "model_type": model_type,
        "estimator": estimator,
        "features_used": features_used,
        "target_column": target_col,
        "date_column": date_col,
        "val_dates": val_dates,
        "y_val_true": [float(v) for v in y_val],
        "y_val_pred": [float(round(p, 2)) for p in y_val_pred],
    }

    joblib_path = MODELS_DIR / f"{model_id}.joblib"
    joblib.dump(model_artifact, joblib_path)

    # Create metadata result
    result = ModelTrainingResult(
        model_id=model_id,
        model_name=model_name,
        model_type=model_type,
        status="Completed",
        dataset_id=clean_id,
        target_column=target_col,
        features_used=features_used,
        train_rows=len(X_train),
        val_rows=len(X_val),
        total_rows=total_rows,
        split_ratio=round((len(X_val) / total_rows) * 100, 1),
        training_time_ms=duration_ms,
        train_date_range=train_date_range,
        val_date_range=val_date_range,
        hyperparameters=hyperparams,
        trained_at=datetime.now(timezone.utc).isoformat(),
    )

    # Save JSON metadata for rapid queries
    json_path = MODELS_DIR / f"{model_id}.json"
    with open(json_path, "w") as f:
        json.dump(result.model_dump(), f, indent=2)

    return result
