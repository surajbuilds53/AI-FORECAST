from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_timeseries_analytics_calculation():
    """Verify that analytics endpoint returns correct points, rolling mean, trend, and distribution stats."""
    # Ensure sample dataset is available
    load_res = client.post("/api/datasets/load-sample")
    assert load_res.status_code == 200

    payload = {
        "dataset_id": "sample_sales.csv",
        "date_column": "date",
        "target_column": "sales",
        "rolling_window": 7,
    }
    res = client.post("/api/analytics/timeseries", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["date_column"] == "date"
    assert data["target_column"] == "sales"
    assert len(data["points"]) == 121
    assert data["points"][0]["actual"] > 0
    assert data["points"][0]["rolling_mean"] is not None
    assert data["points"][0]["trend"] is not None

    # Verify statistics
    stats = data["statistics"]
    assert stats["count"] == 121
    assert stats["mean"] > 0
    assert stats["min"] > 0
    assert stats["max"] > stats["min"]
    assert stats["variance"] > 0
    assert "skewness" in stats
    assert "kurtosis" in stats
    assert stats["missing_count"] == 0

    # Verify trend
    assert data["trend_direction"] in ["Increasing", "Decreasing", "Stable"]
    assert isinstance(data["trend_slope"], float)


def test_analytics_invalid_target_column():
    """Verify 400 error when target column does not exist."""
    payload = {
        "dataset_id": "sample_sales.csv",
        "date_column": "date",
        "target_column": "non_existent_column",
        "rolling_window": 7,
    }
    res = client.post("/api/analytics/timeseries", json=payload)
    assert res.status_code == 400
    assert "not found" in res.json()["detail"]


def test_analytics_custom_window():
    """Verify that different rolling window size is respected."""
    payload = {
        "dataset_id": "sample_sales.csv",
        "date_column": "date",
        "target_column": "sales",
        "rolling_window": 14,
    }
    res = client.post("/api/analytics/timeseries", json=payload)
    assert res.status_code == 200
    assert res.json()["rolling_window"] == 14
