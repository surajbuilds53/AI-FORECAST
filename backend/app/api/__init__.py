from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.dataset import router as dataset_router
from app.api.preprocessing import router as preprocessing_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(dataset_router)
api_router.include_router(preprocessing_router)

__all__ = ["api_router"]
