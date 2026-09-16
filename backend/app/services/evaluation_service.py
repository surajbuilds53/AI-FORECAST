import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import numpy as np
import joblib
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from fastapi import HTTPException, status
from app.schemas.evaluation import (
    EvaluationMetrics,
    ValidationPredictionPoint,
    ModelEvaluationResponse,
    ModelComparisonItem,
    ModelComparisonResponse,
)
from app.ml.training_service import MODELS_DIR


def evaluate_single_model(model_id: str) -> ModelEvaluationResponse:
    """
    Evaluates a trained model artifact using its held-out validation predictions:
    Calculates MAE, MSE, RMSE, and R², and compiles the Actual vs Predicted time-series.
    """
    clean_id = os.path.basename(model_id).replace(".joblib", "").replace(".json", "")
    joblib_path = MODELS_DIR / f"{clean_id}.joblib"

    if not joblib_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trained model artifact '{model_id}' not found.",
        )

    try:
        artifact = joblib.load(joblib_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model artifact: {str(e)}",
        )

    y_true = np.array(artifact["y_val_true"], dtype=float)
    y_pred = np.array(artifact["y_val_pred"], dtype=float)
    val_dates = artifact.get("val_dates", [f"Val_{i+1}" for i in range(len(y_true))])

    if len(y_true) == 0 or len(y_pred) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model validation predictions are empty.",
        )

    # Calculate real mathematical metrics
    mae = float(round(mean_absolute_error(y_true, y_pred), 2))
    mse = float(round(mean_squared_error(y_true, y_pred), 2))
    rmse = float(round(np.sqrt(mse), 2))
    r2 = float(round(r2_score(y_true, y_pred), 4))

    # Calculate MAPE safely (avoid zero division)
    non_zero_mask = y_true != 0
    if non_zero_mask.any():
        mape = float(round(np.mean(np.abs((y_true[non_zero_mask] - y_pred[non_zero_mask]) / y_true[non_zero_mask])) * 100, 2))
    else:
        mape = None

    metrics = EvaluationMetrics(
        mae=mae,
        mse=mse,
        rmse=rmse,
        r2=r2,
        mape=mape,
    )

    predictions: List[ValidationPredictionPoint] = []
    for d, act, pred in zip(val_dates, y_true, y_pred):
        predictions.append(
            ValidationPredictionPoint(
                date=str(d),
                actual=float(round(act, 2)),
                predicted=float(round(pred, 2)),
                residual=float(round(act - pred, 2)),
            )
        )

    return ModelEvaluationResponse(
        model_id=clean_id,
        model_name=artifact.get("model_name", clean_id),
        model_type=artifact.get("model_type", "unknown"),
        target_column=artifact.get("target_column", "target"),
        metrics=metrics,
        predictions=predictions,
        val_rows=len(y_true),
        evaluated_at=datetime.now(timezone.utc).isoformat(),
    )


def compare_all_models() -> ModelComparisonResponse:
    """
    Evaluates all trained model runs, compares their MAE, RMSE, and R² scores,
    and identifies the best model specifically on the validation partition.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib_files = list(MODELS_DIR.glob("*.joblib"))

    if not joblib_files:
        return ModelComparisonResponse(
            models=[],
            best_model_id=None,
            best_model_name=None,
            evaluation_summary="No trained models available for comparison yet. Train models in Milestone 5 first.",
        )

    evaluated_items: List[ModelComparisonItem] = []

    for file_path in joblib_files:
        model_id = file_path.stem
        try:
            eval_res = evaluate_single_model(model_id)
            evaluated_items.append(
                ModelComparisonItem(
                    model_id=eval_res.model_id,
                    model_name=eval_res.model_name,
                    model_type=eval_res.model_type,
                    mae=eval_res.metrics.mae,
                    rmse=eval_res.metrics.rmse,
                    r2=eval_res.metrics.r2,
                    is_best=False,
                    recommendation_reason="",
                )
            )
        except Exception:
            continue

    if not evaluated_items:
        return ModelComparisonResponse(
            models=[],
            best_model_id=None,
            best_model_name=None,
            evaluation_summary="Failed to evaluate trained models.",
        )

    # Rank by lowest RMSE first, then highest R²
    evaluated_items.sort(key=lambda x: (x.rmse, -x.r2))

    # Mark the best model
    best_item = evaluated_items[0]
    best_item.is_best = True
    best_item.recommendation_reason = (
        f"Achieved the lowest RMSE ({best_item.rmse}) and highest R² ({best_item.r2}) "
        f"on the chronological validation holdout dataset."
    )

    for item in evaluated_items[1:]:
        item.recommendation_reason = (
            f"Evaluated as a comparative baseline benchmark on the validation split."
        )

    summary = (
        f"Model evaluation performed across {len(evaluated_items)} trained architecture(s). "
        f"'{best_item.model_name}' performed best on the selected validation holdout partition, "
        f"minimizing prediction error with an RMSE of {best_item.rmse} and explaining "
        f"{round(max(best_item.r2, 0) * 100, 1)}% of target variance (R² = {best_item.r2}). "
        f"This comparative assessment is based strictly on the held-out validation data."
    )

    return ModelComparisonResponse(
        models=evaluated_items,
        best_model_id=best_item.model_id,
        best_model_name=best_item.model_name,
        evaluation_summary=summary,
    )
