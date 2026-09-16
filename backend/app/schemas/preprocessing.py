from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PreprocessingRequest(BaseModel):
    dataset_id: str
    datetime_column: str
    target_column: str
    missing_value_strategy: str = Field(
        default="forward_fill",
        description="Strategy: forward_fill | backward_fill | mean | median | drop"
    )
    include_calendar_features: bool = Field(
        default=True,
        description="Generate year, month, day, day_of_week, quarter, is_weekend"
    )
    include_lag_features: bool = Field(
        default=True,
        description="Generate lag_1 and lag_7 features for the target variable"
    )
    include_rolling_mean: bool = Field(
        default=True,
        description="Generate 7-period rolling moving average"
    )


class PreprocessingStepLog(BaseModel):
    step_number: int
    step_name: str
    description: str
    details: str
    status: str = "completed"


class PreprocessingResponse(BaseModel):
    dataset_id: str
    preprocessed_dataset_id: str
    datetime_column: str
    target_column: str
    original_rows: int
    processed_rows: int
    original_columns: int
    processed_columns: int
    features_created: List[str]
    steps_log: List[PreprocessingStepLog]
    preview_rows: List[Dict[str, Any]]
    summary_stats: Dict[str, Any]
    processed_at: str


class ColumnRecommendations(BaseModel):
    dataset_id: str
    recommended_datetime_column: Optional[str] = None
    all_datetime_columns: List[str] = []
    recommended_target_column: Optional[str] = None
    all_numeric_columns: List[str] = []
    all_columns: List[str] = []
