import io
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import numpy as np
import pandas as pd
from fastapi import HTTPException, status
from app.schemas.dataset import ColumnProfile, DatasetSummary, DatasetListItem

# Base dataset directory resolution
DATASETS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "datasets"
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit for safety


def sanitize_filename(filename: str) -> str:
    """Sanitizes filename against path traversal and dangerous characters."""
    base_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_\.\-]', '_', base_name)
    if not clean_name.lower().endswith(".csv"):
        clean_name += ".csv"
    return clean_name


def infer_column_type(series: pd.Series) -> str:
    """
    Infers whether a pandas Series represents a datetime, numeric, or categorical feature.
    Used for automated feature detection and validation.
    """
    # 1. Numeric check
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    # 2. Datetime check
    non_null_samples = series.dropna().astype(str).head(30)
    if len(non_null_samples) > 0:
        # Avoid treating pure numbers or short codes as dates
        if not non_null_samples.str.isnumeric().all():
            try:
                pd.to_datetime(non_null_samples, errors="raise")
                return "datetime"
            except Exception:
                pass

    return "categorical"


def profile_dataframe(df: pd.DataFrame, dataset_id: str, filename: str, file_size_bytes: int) -> DatasetSummary:
    """Calculates comprehensive column statistics, types, and preview rows."""
    row_count, col_count = df.shape
    columns_profile: List[ColumnProfile] = []
    total_missing_cells = 0

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isna().sum())
        total_missing_cells += missing_count
        missing_pct = round((missing_count / max(row_count, 1)) * 100, 2)
        inferred = infer_column_type(series)
        unique_cnt = int(series.nunique(dropna=True))

        # Sample values for viva demonstration inspection
        samples = [str(x) for x in series.dropna().head(3).tolist()]

        columns_profile.append(
            ColumnProfile(
                name=str(col),
                dtype=str(series.dtype),
                inferred_type=inferred,
                missing_count=missing_count,
                missing_percentage=missing_pct,
                unique_count=unique_cnt,
                sample_values=samples,
            )
        )

    total_cells = max(row_count * col_count, 1)
    missing_cells_pct = round((total_missing_cells / total_cells) * 100, 2)

    # Sanitize preview rows for JSON serialization (replace NaN with None)
    preview_df = df.head(10).replace({np.nan: None})
    preview_rows = preview_df.to_dict(orient="records")

    return DatasetSummary(
        id=dataset_id,
        filename=filename,
        file_size_bytes=file_size_bytes,
        row_count=row_count,
        column_count=col_count,
        columns=columns_profile,
        total_missing_values=total_missing_cells,
        missing_cells_percentage=missing_cells_pct,
        preview_rows=preview_rows,
        created_at=datetime.now(timezone.utc).isoformat(),
    )


def process_csv_bytes(file_bytes: bytes, filename: str) -> DatasetSummary:
    """Validates raw CSV content, parses into DataFrame, and persists to disk."""
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes). Please upload a valid CSV file.",
        )

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    # Enforce CSV extension
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .csv files are supported.",
        )

    # Attempt parsing with utf-8 first, fallback to latin1
    try:
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin1")
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV has no data or header.",
        )
    except pd.errors.ParserError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed CSV structure: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse CSV: {str(e)}",
        )

    if df.empty or len(df.columns) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The CSV must contain at least 1 row and 1 column of data.",
        )

    dataset_id = str(uuid.uuid4())[:8]
    sanitized_name = sanitize_filename(filename)
    saved_filename = f"{dataset_id}_{sanitized_name}"

    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    target_path = DATASETS_DIR / saved_filename

    with open(target_path, "wb") as f:
        f.write(file_bytes)

    return profile_dataframe(df, dataset_id=saved_filename, filename=sanitized_name, file_size_bytes=len(file_bytes))


def list_datasets() -> List[DatasetListItem]:
    """Scans datasets directory and returns available CSV datasets."""
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    items: List[DatasetListItem] = []

    for file_path in DATASETS_DIR.glob("*.csv"):
        try:
            size = file_path.stat().st_size
            if size == 0:
                continue
            df_header = pd.read_csv(file_path, nrows=5)
            # Count rows efficiently
            with open(file_path, "rb") as f:
                row_count = sum(1 for _ in f) - 1
            row_count = max(row_count, 0)
            col_count = len(df_header.columns)

            items.append(
                DatasetListItem(
                    id=file_path.name,
                    filename=file_path.name.split("_", 1)[-1] if "_" in file_path.name else file_path.name,
                    file_size_bytes=size,
                    row_count=row_count,
                    column_count=col_count,
                    created_at=datetime.fromtimestamp(file_path.stat().st_mtime).isoformat() + "Z",
                )
            )
        except Exception:
            continue

    return sorted(items, key=lambda x: x.created_at, reverse=True)


def get_dataset_summary_by_id(dataset_id: str) -> DatasetSummary:
    """Reads a stored dataset by filename/ID and returns its full profiling summary."""
    clean_id = os.path.basename(dataset_id)
    target_path = DATASETS_DIR / clean_id

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{dataset_id}' not found.",
        )

    try:
        df = pd.read_csv(target_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset: {str(e)}",
        )

    display_name = clean_id.split("_", 1)[-1] if "_" in clean_id else clean_id
    return profile_dataframe(df, dataset_id=clean_id, filename=display_name, file_size_bytes=target_path.stat().st_size)
