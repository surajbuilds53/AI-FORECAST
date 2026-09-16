import io
import csv
from fastapi import APIRouter, Query, Response
from fastapi.responses import StreamingResponse
from app.schemas.forecast import ForecastRequest, ForecastResponse
from app.services.forecast_service import generate_future_forecast

router = APIRouter(prefix="/forecast", tags=["Forecasting"])


@router.post("/generate", response_model=ForecastResponse)
def post_generate_forecast(request: ForecastRequest):
    """
    Generate out-of-sample multi-step future predictions with empirical confidence intervals.
    Uses recursive feature propagation over the specified forecasting horizon (7, 14, 30 days).
    """
    return generate_future_forecast(request)


@router.get("/export")
def export_forecast_csv(
    model_id: str = Query(..., description="ID of trained model"),
    forecast_horizon: int = Query(14, ge=1, le=90, description="Future steps to forecast"),
    confidence_level: float = Query(0.95, ge=0.5, le=0.99, description="Confidence interval level"),
    dataset_id: str = Query(None, description="Optional dataset ID override"),
):
    """
    Generate and export out-of-sample future predictions as a downloadable CSV file.
    Includes date, step, predicted value, lower bound, and upper bound.
    """
    req = ForecastRequest(
        model_id=model_id,
        forecast_horizon=forecast_horizon,
        confidence_level=confidence_level,
        dataset_id=dataset_id,
    )
    forecast_res = generate_future_forecast(req)

    output = io.StringIO()
    writer = csv.writer(output)

    # Write Header
    writer.writerow([
        "Step",
        "Date",
        f"Predicted_{forecast_res.target_column}",
        f"Lower_Bound_{int(confidence_level * 100)}%_CI",
        f"Upper_Bound_{int(confidence_level * 100)}%_CI",
        "Model_Name",
        "Model_Type",
    ])

    # Write Data Rows
    for pt in forecast_res.forecast_points:
        writer.writerow([
            pt.step,
            pt.date,
            pt.predicted,
            pt.lower_bound,
            pt.upper_bound,
            forecast_res.model_name,
            forecast_res.model_type,
        ])

    csv_data = output.getvalue()
    filename = f"forecast_{forecast_res.target_column}_{forecast_horizon}d.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
