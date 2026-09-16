from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_preprocessing_recommendations():
    """Verify that recommendations detect datetime and numeric target columns."""
    # Ensure sample dataset exists
    load_res = client.post("/api/datasets/load-sample")
    assert load_res.status_code == 200

    res = client.get("/api/preprocessing/recommendations/sample_sales.csv")
    assert res.status_code == 200
    data = res.json()
    assert data["recommended_datetime_column"] == "date"
    assert "date" in data["all_datetime_columns"]
    assert "sales" in data["all_numeric_columns"]
    assert data["recommended_target_column"] == "sales"


def test_full_preprocessing_pipeline():
    """Verify that preprocessing correctly sorts, engineers features, and generates audit logs."""
    payload = {
        "dataset_id": "sample_sales.csv",
        "datetime_column": "date",
        "target_column": "sales",
        "missing_value_strategy": "forward_fill",
        "include_calendar_features": True,
        "include_lag_features": True,
        "include_rolling_mean": True,
    }
    res = client.post("/api/preprocessing/process", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["processed_rows"] == 121
    assert data["processed_columns"] > data["original_columns"]
    # Check created features
    features = data["features_created"]
    assert "date_year" in features
    assert "date_month" in features
    assert "date_is_weekend" in features
    assert "sales_lag_1" in features
    assert "sales_lag_7" in features
    assert "sales_rolling_mean_7" in features
    # Check audit log steps
    assert len(data["steps_log"]) >= 6
    step_names = [s["step_name"] for s in data["steps_log"]]
    assert "Chronological Sorting" in step_names
    assert "Missing Value Handling" in step_names
    assert "Calendar Feature Engineering" in step_names
    assert "Lag Feature Engineering" in step_names
    assert "Rolling Mean Statistics" in step_names
    # Check summary statistics
    stats = data["summary_stats"]
    assert stats["target_column"] == "sales"
    assert stats["count"] == 121
    assert stats["min"] > 0
    assert stats["max"] > stats["min"]


def test_invalid_datetime_rejected():
    """Verify that invalid datetime column returns 400."""
    payload = {
        "dataset_id": "sample_sales.csv",
        "datetime_column": "non_existent_date",
        "target_column": "sales",
        "missing_value_strategy": "forward_fill",
    }
    res = client.post("/api/preprocessing/process", json=payload)
    assert res.status_code == 400
    assert "does not exist" in res.json()["detail"]


def test_same_datetime_and_target_rejected():
    """Verify that choosing same column for datetime and target returns 400."""
    payload = {
        "dataset_id": "sample_sales.csv",
        "datetime_column": "date",
        "target_column": "date",
        "missing_value_strategy": "forward_fill",
    }
    res = client.post("/api/preprocessing/process", json=payload)
    assert res.status_code == 400
    assert "cannot be the same" in res.json()["detail"]
