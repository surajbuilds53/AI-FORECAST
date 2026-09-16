from fastapi import APIRouter
from app.schemas.preprocessing import (
    PreprocessingRequest,
    PreprocessingResponse,
    ColumnRecommendations,
)
from app.services.preprocessing_service import (
    get_column_recommendations,
    execute_preprocessing,
)

router = APIRouter(prefix="/preprocessing", tags=["Preprocessing"])


@router.get("/recommendations/{dataset_id}", response_model=ColumnRecommendations)
def get_recommendations(dataset_id: str) -> ColumnRecommendations:
    """
    Analyzes dataset columns and returns auto-detected recommendations for
    datetime column and numeric target column.
    """
    return get_column_recommendations(dataset_id)


@router.post("/process", response_model=PreprocessingResponse)
def run_preprocessing(request: PreprocessingRequest) -> PreprocessingResponse:
    """
    Executes chronological sorting, missing-value handling, and feature engineering
    (calendar features, lag attributes, rolling statistics) on the dataset.
    """
    return execute_preprocessing(request)
