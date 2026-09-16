from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TrainingRequest(BaseModel):
    dataset_id: str
    target_column: str
    feature_columns: Optional[List[str]] = None
    model_type: str = Field(
        default="linear_regression",
        description="Model type: 'linear_regression' or 'random_forest'"
    )
    test_split_ratio: float = Field(
        default=0.20,
        ge=0.10,
        le=0.50,
        description="Chronological validation holdout ratio (default 20%)"
    )
    hyperparameters: Optional[Dict[str, Any]] = None


class ModelTrainingResult(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    status: str
    dataset_id: str
    target_column: str
    features_used: List[str]
    train_rows: int
    val_rows: int
    total_rows: int
    split_ratio: float
    training_time_ms: float
    train_date_range: str
    val_date_range: str
    hyperparameters: Dict[str, Any]
    trained_at: str


class AvailableModelInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    strengths: List[str]
    default_hyperparameters: Dict[str, Any]
