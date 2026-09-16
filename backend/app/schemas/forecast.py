from typing import List, Optional
from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    model_id: str
    forecast_horizon: int = Field(default=14, ge=1, le=90, description="Forecast steps/days into the future")
    confidence_level: float = Field(default=0.95, ge=0.50, le=0.99, description="Confidence level for prediction intervals")
    dataset_id: Optional[str] = None


class HistoricalPoint(BaseModel):
    date: str
    actual: float


class ForecastPoint(BaseModel):
    date: str
    predicted: float
    lower_bound: float
    upper_bound: float
    step: int


class ForecastSummary(BaseModel):
    horizon_days: int
    mean_forecast: float
    min_forecast: float
    max_forecast: float
    last_historical_value: float
    trend_direction: str
    pct_change_from_last: float
    confidence_level_pct: int
    viva_explanation: str


class ForecastResponse(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    target_column: str
    date_column: str
    forecast_horizon: int
    confidence_level: float
    historical_points: List[HistoricalPoint]
    forecast_points: List[ForecastPoint]
    summary: ForecastSummary
    generated_at: str
