from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_linear_regression_training():
    """Verify that Linear Regression trains with chronological splitting and produces telemetry."""
    # Ensure sample dataset is loaded
    client.post("/api/datasets/load-sample")

    payload = {
        "dataset_id": "sample_sales.csv",
        "target_column": "sales",
        "model_type": "linear_regression",
        "test_split_ratio": 0.20,
    }
    res = client.post("/api/models/train", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["model_type"] == "linear_regression"
    assert data["model_name"] == "Linear Regression Baseline"
    assert data["status"] == "Completed"
    assert data["total_rows"] == 121
    assert data["train_rows"] + data["val_rows"] == 121
    assert data["train_rows"] > data["val_rows"]
    assert data["training_time_ms"] > 0
    assert len(data["features_used"]) > 0
    assert "to" in data["train_date_range"]
    assert "to" in data["val_date_range"]


def test_random_forest_training():
    """Verify that Random Forest Regressor trains with specified hyperparameters."""
    payload = {
        "dataset_id": "sample_sales.csv",
        "target_column": "sales",
        "model_type": "random_forest",
        "test_split_ratio": 0.20,
        "hyperparameters": {
            "n_estimators": 50,
            "max_depth": 5,
        },
    }
    res = client.post("/api/models/train", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["model_type"] == "random_forest"
    assert data["model_name"] == "Random Forest Regressor"
    assert data["status"] == "Completed"
    assert data["train_rows"] == 96
    assert data["val_rows"] == 25
    assert data["training_time_ms"] > 0


def test_list_trained_models():
    """Verify that list endpoint returns previously trained models."""
    res = client.get("/api/models")
    assert res.status_code == 200
    models = res.json()
    assert isinstance(models, list)
    assert len(models) >= 2


def test_invalid_model_type_rejected():
    """Verify 400 error when unsupported model type is submitted."""
    payload = {
        "dataset_id": "sample_sales.csv",
        "target_column": "sales",
        "model_type": "quantum_neural_net",
    }
    res = client.post("/api/models/train", json=payload)
    assert res.status_code == 400
    assert "Unsupported model type" in res.json()["detail"]
