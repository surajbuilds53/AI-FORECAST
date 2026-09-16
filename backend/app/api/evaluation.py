from fastapi import APIRouter
from app.schemas.evaluation import ModelEvaluationResponse, ModelComparisonResponse
from app.services.evaluation_service import evaluate_single_model, compare_all_models

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])


@router.get("/model/{model_id}", response_model=ModelEvaluationResponse)
def get_model_evaluation(model_id: str):
    """
    Retrieve real evaluation metrics (MAE, MSE, RMSE, R²) and ground truth vs prediction
    time-series points on the held-out validation set for a specific trained model.
    """
    return evaluate_single_model(model_id)


@router.get("/compare", response_model=ModelComparisonResponse)
def get_models_comparison():
    """
    Compare all serialized trained models across MAE, RMSE, and R² scores,
    and identify the top-performing model specifically on the validation partition.
    """
    return compare_all_models()
