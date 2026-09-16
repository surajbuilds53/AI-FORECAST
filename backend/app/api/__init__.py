from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.dataset import router as dataset_router
from app.api.preprocessing import router as preprocessing_router
from app.api.analytics import router as analytics_router
from app.api.models import router as models_router
from app.api.evaluation import router as evaluation_router
from app.api.forecast import router as forecast_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(dataset_router)
api_router.include_router(preprocessing_router)
api_router.include_router(analytics_router)
api_router.include_router(models_router)
api_router.include_router(evaluation_router)
api_router.include_router(forecast_router)

__all__ = ["api_router"]
