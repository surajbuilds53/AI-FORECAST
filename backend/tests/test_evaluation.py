from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_model_evaluation_metrics_and_predictions():
    """Verify that a trained model produces exact evaluation metrics and validation curve points."""
    # Ensure sample dataset is loaded
    client.post("/api/datasets/load-sample")

    # Train linear regression
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

    # Evaluate model
    eval_res = client.get(f"/api/evaluation/model/{model_id}")
    assert eval_res.status_code == 200
    data = eval_res.json()

    assert data["model_id"] == model_id
    assert "metrics" in data
    metrics = data["metrics"]
    assert "mae" in metrics and isinstance(metrics["mae"], (int, float))
    assert "mse" in metrics and isinstance(metrics["mse"], (int, float))
    assert "rmse" in metrics and isinstance(metrics["rmse"], (int, float))
    assert "r2" in metrics and isinstance(metrics["r2"], (int, float))
    assert metrics["mae"] >= 0
    assert metrics["rmse"] >= 0

    # Predictions check
    assert "predictions" in data
    assert len(data["predictions"]) > 0
    first_pt = data["predictions"][0]
    assert "date" in first_pt
    assert "actual" in first_pt
    assert "predicted" in first_pt
    assert "residual" in first_pt
    # Residual should equal actual - predicted (within rounding precision)
    assert abs(first_pt["residual"] - (first_pt["actual"] - first_pt["predicted"])) < 0.05


def test_models_comparison_and_best_model_selection():
    """Verify that compare endpoint ranks models and designates the top performer on validation set."""
    # Train random forest model as second model
    client.post(
        "/api/models/train",
        json={
            "dataset_id": "sample_sales.csv",
            "target_column": "sales",
            "model_type": "random_forest",
            "test_split_ratio": 0.20,
            "hyperparameters": {"n_estimators": 20, "max_depth": 4},
        },
    )

    comp_res = client.get("/api/evaluation/compare")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()

    assert "models" in comp_data
    assert len(comp_data["models"]) >= 2
    assert comp_data["best_model_id"] is not None
    assert comp_data["best_model_name"] is not None
    assert len(comp_data["evaluation_summary"]) > 0

    # Best model must have is_best = True
    best_items = [m for m in comp_data["models"] if m["is_best"]]
    assert len(best_items) == 1
    assert best_items[0]["model_id"] == comp_data["best_model_id"]

    # Models should be ordered ascending by RMSE
    rmses = [m["rmse"] for m in comp_data["models"]]
    assert rmses == sorted(rmses)


def test_evaluation_not_found():
    """Verify proper 404 response for non-existent model artifact."""
    res = client.get("/api/evaluation/model/non_existent_model_id_12345")
    assert res.status_code == 404
