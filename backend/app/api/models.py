from typing import List
from fastapi import APIRouter
from app.schemas.model import (
    TrainingRequest,
    ModelTrainingResult,
    AvailableModelInfo,
)
from app.ml.training_service import (
    get_available_models,
    train_forecasting_model,
    list_trained_models,
    get_trained_model_by_id,
)

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("/available", response_model=List[AvailableModelInfo])
def get_supported_models() -> List[AvailableModelInfo]:
    """Returns the catalog of supported machine learning forecasting models."""
    return get_available_models()


@router.post("/train", response_model=ModelTrainingResult)
def train_model(request: TrainingRequest) -> ModelTrainingResult:
    """
    Trains a machine learning model on the specified dataset with
    strict chronological train/validation splitting and records performance telemetry.
    """
    return train_forecasting_model(request)


@router.get("", response_model=List[ModelTrainingResult])
def get_all_trained_models() -> List[ModelTrainingResult]:
    """Lists all previously trained forecasting model runs."""
    return list_trained_models()


@router.get("/{model_id}", response_model=ModelTrainingResult)
def get_model_details(model_id: str) -> ModelTrainingResult:
    """Fetches details and telemetry of a specific trained model."""
    return get_trained_model_by_id(model_id)
