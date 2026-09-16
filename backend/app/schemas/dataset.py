from typing import Any, List
from pydantic import BaseModel


class ColumnProfile(BaseModel):
    name: str
    dtype: str
    inferred_type: str  # 'datetime' | 'numeric' | 'categorical'
    missing_count: int
    missing_percentage: float
    unique_count: int
    sample_values: List[Any]


class DatasetSummary(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    columns: List[ColumnProfile]
    total_missing_values: int
    missing_cells_percentage: float
    preview_rows: List[dict]
    created_at: str


class DatasetListItem(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    created_at: str
