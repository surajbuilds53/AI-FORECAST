from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyticsRequest(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    rolling_window: int = Field(default=7, ge=2, le=90, description="Rolling moving average window size")


class TimeSeriesPoint(BaseModel):
    date: str
    actual: float
    rolling_mean: Optional[float] = None
    trend: Optional[float] = None


class DatasetStatistics(BaseModel):
    count: int
    mean: float
    std: float
    min: float
    max: float
    median: float
    variance: float
    skewness: float
    kurtosis: float
    missing_count: int
    missing_percentage: float
    q25: float
    q75: float


class AnalyticsResponse(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    rolling_window: int
    points: List[TimeSeriesPoint]
    statistics: DatasetStatistics
    trend_direction: str  # 'Increasing' | 'Decreasing' | 'Stable'
    trend_slope: float
