from fastapi import APIRouter
from app.schemas.analytics import AnalyticsRequest, AnalyticsResponse
from app.services.analytics_service import generate_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post("/timeseries", response_model=AnalyticsResponse)
def get_timeseries_analytics(request: AnalyticsRequest) -> AnalyticsResponse:
    """
    Computes time-series actuals, rolling moving average, linear trendline,
    and descriptive statistical distribution metrics for interactive visualization.
    """
    return generate_analytics(request)
