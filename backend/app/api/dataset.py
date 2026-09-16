from typing import List
from fastapi import APIRouter, File, UploadFile, status
from app.schemas.dataset import DatasetSummary, DatasetListItem
from app.services.dataset_service import (
    process_csv_bytes,
    list_datasets,
    get_dataset_summary_by_id,
    DATASETS_DIR,
)

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.post("/upload", response_model=DatasetSummary, status_code=status.HTTP_201_CREATED)
async def upload_dataset(file: UploadFile = File(...)) -> DatasetSummary:
    """
    Upload and validate a CSV dataset.
    Performs security validation (mime, size, encoding) and returns column profiling & preview.
    """
    file_bytes = await file.read()
    return process_csv_bytes(file_bytes, file.filename or "dataset.csv")


@router.get("", response_model=List[DatasetListItem])
def get_datasets() -> List[DatasetListItem]:
    """List all available datasets in the storage repository."""
    return list_datasets()


@router.get("/{dataset_id}", response_model=DatasetSummary)
def get_dataset(dataset_id: str) -> DatasetSummary:
    """Get metadata, column profile, and preview rows for a specific dataset."""
    return get_dataset_summary_by_id(dataset_id)


@router.post("/load-sample", response_model=DatasetSummary)
def load_sample() -> DatasetSummary:
    """
    Loads the pre-packaged 'sample_sales.csv' for quick college viva demonstrations.
    """
    sample_file = DATASETS_DIR / "sample_sales.csv"
    if not sample_file.exists():
        dummy_data = b"date,sales,store_visitors\n2024-01-01,100,10\n2024-01-02,120,12\n"
        return process_csv_bytes(dummy_data, "sample_sales.csv")

    with open(sample_file, "rb") as f:
        content = f.read()

    return process_csv_bytes(content, "sample_sales.csv")
