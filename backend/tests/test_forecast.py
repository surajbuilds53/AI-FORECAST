from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_forecast_generation_and_confidence_intervals():
    """Verify recursive future forecasting, feature propagation, and expanding prediction intervals."""
    # Ensure sample dataset is loaded
    client.post("/api/datasets/load-sample")

    # Train linear regression model
    train_res = client.post(
        "/api/models/train",
        json={
            "dataset_id": "sample_sales.csv",
            "target_column": "sales",
            "model_type": "linear_regression",
            "test_split_ratio": 0.20,
        },
    )
    assert train_res.status_code == 200
    model_id = train_res.json()["model_id"]

    # Generate 14-day future forecast
    forecast_payload = {
        "model_id": model_id,
        "forecast_horizon": 14,
        "confidence_level": 0.95,
    }
    res = client.post("/api/forecast/generate", json=forecast_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["model_id"] == model_id
    assert data["forecast_horizon"] == 14
    assert len(data["forecast_points"]) == 14
    assert len(data["historical_points"]) > 0

    first_pt = data["forecast_points"][0]
    last_pt = data["forecast_points"][-1]

    # Bounds sanity
    assert first_pt["lower_bound"] <= first_pt["predicted"] <= first_pt["upper_bound"]
    assert last_pt["lower_bound"] <= last_pt["predicted"] <= last_pt["upper_bound"]

    # Compounding uncertainty: Confidence interval band should widen as step increases
    ci_step_1 = first_pt["upper_bound"] - first_pt["lower_bound"]
    ci_step_14 = last_pt["upper_bound"] - last_pt["lower_bound"]
    assert ci_step_14 >= ci_step_1

    # Summary checks
    summary = data["summary"]
    assert summary["horizon_days"] == 14
    assert summary["mean_forecast"] > 0
    assert summary["min_forecast"] <= summary["max_forecast"]
    assert summary["trend_direction"] in ["Upward Expansion", "Downward Contraction", "Neutral / Stable"]
    assert "viva_explanation" in summary


def test_random_forest_recursive_forecasting():
    """Verify recursive multi-step predictions using Random Forest Regressor."""
    # Train random forest model
    train_res = client.post(
        "/api/models/train",
        json={
            "dataset_id": "sample_sales.csv",
            "target_column": "sales",
            "model_type": "random_forest",
            "test_split_ratio": 0.20,
            "hyperparameters": {"n_estimators": 25, "max_depth": 5},
        },
    )
    assert train_res.status_code == 200
    rf_model_id = train_res.json()["model_id"]

    # 30-day forecast
    res = client.post(
        "/api/forecast/generate",
        json={
            "model_id": rf_model_id,
            "forecast_horizon": 30,
            "confidence_level": 0.90,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["forecast_points"]) == 30
    assert data["summary"]["horizon_days"] == 30


def test_forecast_csv_export():
    """Verify downloading forecast as downloadable CSV."""
    models_res = client.get("/api/models")
    assert models_res.status_code == 200
    models = models_res.json()
    assert len(models) > 0
    model_id = models[0]["model_id"]

    export_res = client.get(
        f"/api/forecast/export?model_id={model_id}&forecast_horizon=7&confidence_level=0.95"
    )
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers.get("content-type", "")
    assert "attachment;" in export_res.headers.get("content-disposition", "")
    csv_text = export_res.text
    assert "Step,Date,Predicted_sales" in csv_text
    lines = csv_text.strip().split("\n")
    # 1 header + 7 data rows
    assert len(lines) == 8


def test_forecast_invalid_model_id():
    """Verify proper 404 for invalid model artifact."""
    res = client.post(
        "/api/forecast/generate",
        json={"model_id": "invalid_model_xyz", "forecast_horizon": 7},
    )
    assert res.status_code == 404
