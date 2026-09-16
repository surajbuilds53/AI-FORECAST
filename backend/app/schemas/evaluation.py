from typing import List, Optional
from pydantic import BaseModel


class EvaluationMetrics(BaseModel):
    mae: float
    mse: float
    rmse: float
    r2: float
    mape: Optional[float] = None


class ValidationPredictionPoint(BaseModel):
    date: str
    actual: float
    predicted: float
    residual: float


class ModelEvaluationResponse(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    target_column: str
    metrics: EvaluationMetrics
    predictions: List[ValidationPredictionPoint]
    val_rows: int
    evaluated_at: str


class ModelComparisonItem(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    mae: float
    rmse: float
    r2: float
    is_best: bool
    recommendation_reason: str


class ModelComparisonResponse(BaseModel):
    models: List[ModelComparisonItem]
    best_model_id: Optional[str] = None
    best_model_name: Optional[str] = None
    evaluation_summary: str
