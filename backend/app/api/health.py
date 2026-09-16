from fastapi import APIRouter
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Returns the operational status of the AI Forecast backend service."""
    return HealthResponse(
        status="healthy",
        service="AI Forecast Backend",
        version="0.1.0",
    )
