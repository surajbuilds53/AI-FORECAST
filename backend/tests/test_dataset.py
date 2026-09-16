import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_upload_valid_csv():
    """Verify that a valid CSV file uploads successfully and calculates profiling."""
    csv_content = (
        "date,sales,category\n"
        "2024-01-01,150.50,Retail\n"
        "2024-01-02,200.00,Retail\n"
        "2024-01-03,175.25,Online\n"
    )
    files = {"file": ("test_sales.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["row_count"] == 3
    assert data["column_count"] == 3
    assert len(data["columns"]) == 3
    assert len(data["preview_rows"]) == 3
    # Check column inferred types
    types = {col["name"]: col["inferred_type"] for col in data["columns"]}
    assert types["date"] == "datetime"
    assert types["sales"] == "numeric"
    assert types["category"] == "categorical"


def test_upload_empty_csv_rejected():
    """Verify that an empty (0 byte) file is rejected with 400 Bad Request."""
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_non_csv_rejected():
    """Verify that non-CSV extensions are rejected with 400 Bad Request."""
    files = {"file": ("data.txt", io.BytesIO(b"hello world"), "text/plain")}
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400
    assert ".csv" in response.json()["detail"].lower()


def test_load_sample_dataset():
    """Verify that loading the built-in sample dataset succeeds."""
    response = client.post("/api/datasets/load-sample")
    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] > 0
    assert data["column_count"] >= 3
    assert "date" in [col["name"] for col in data["columns"]]
    assert "sales" in [col["name"] for col in data["columns"]]


def test_list_datasets():
    """Verify that the dataset list endpoint returns an array."""
    response = client.get("/api/datasets")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
