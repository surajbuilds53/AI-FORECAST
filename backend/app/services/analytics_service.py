import os
from pathlib import Path
from typing import List
import numpy as np
import pandas as pd
from fastapi import HTTPException, status
from app.schemas.analytics import (
    AnalyticsRequest,
    TimeSeriesPoint,
    DatasetStatistics,
    AnalyticsResponse,
)
from app.services.dataset_service import DATASETS_DIR


def generate_analytics(request: AnalyticsRequest) -> AnalyticsResponse:
    """
    Computes time-series data with rolling moving average, linear trendline,
    and descriptive statistical distribution metrics.
    """
    clean_id = os.path.basename(request.dataset_id)
    base_name = clean_id.replace(".csv", "")

    # Check for preprocessed dataset first, fallback to original dataset
    preprocessed_path = DATASETS_DIR / f"{base_name}_preprocessed.csv"
    raw_path = DATASETS_DIR / clean_id

    if preprocessed_path.exists():
        target_path = preprocessed_path
    elif raw_path.exists():
        target_path = raw_path
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{request.dataset_id}' not found.",
        )

    try:
        df = pd.read_csv(target_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset: {str(e)}",
        )

    date_col = request.date_column
    target_col = request.target_column

    if date_col not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Date column '{date_col}' not found. Available: {list(df.columns)}",
        )

    if target_col not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target column '{target_col}' not found. Available: {list(df.columns)}",
        )

    # Convert date and sort chronologically ascending
    try:
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        df = df.dropna(subset=[date_col]).sort_values(by=date_col, ascending=True).reset_index(drop=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse dates in '{date_col}': {str(e)}",
        )

    # Convert target to numeric
    try:
        df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target variable '{target_col}' must be numeric: {str(e)}",
        )

    total_rows = len(df)
    missing_count = int(df[target_col].isna().sum())
    missing_pct = round((missing_count / max(total_rows, 1)) * 100, 2)

    # Impute temporarily for smooth visualization if nulls present
    clean_series = df[target_col].ffill().bfill()
    if clean_series.empty or clean_series.isna().all():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target variable '{target_col}' contains no valid numeric values.",
        )

    # 1. Rolling Moving Average
    window = min(request.rolling_window, max(len(clean_series), 2))
    rolling_series = clean_series.rolling(window=window, min_periods=1).mean()

    # 2. Linear Trendline via Least-Squares Fit (y = mx + c)
    x_indices = np.arange(len(clean_series))
    y_values = clean_series.values
    slope, intercept = np.polyfit(x_indices, y_values, 1)
    trend_series = slope * x_indices + intercept

    # Trend direction categorization
    slope_float = float(round(slope, 4))
    if abs(slope_float) < 0.05:
        trend_direction = "Stable"
    elif slope_float > 0:
        trend_direction = "Increasing"
    else:
        trend_direction = "Decreasing"

    # 3. Descriptive Statistics
    stats = DatasetStatistics(
        count=int(clean_series.count()),
        mean=float(round(clean_series.mean(), 2)),
        std=float(round(clean_series.std(), 2)),
        min=float(round(clean_series.min(), 2)),
        max=float(round(clean_series.max(), 2)),
        median=float(round(clean_series.median(), 2)),
        variance=float(round(clean_series.var(), 2)),
        skewness=float(round(clean_series.skew(), 2) if len(clean_series) > 2 else 0.0),
        kurtosis=float(round(clean_series.kurtosis(), 2) if len(clean_series) > 3 else 0.0),
        missing_count=missing_count,
        missing_percentage=missing_pct,
        q25=float(round(clean_series.quantile(0.25), 2)),
        q75=float(round(clean_series.quantile(0.75), 2)),
    )

    # 4. Formulate TimeSeriesPoint objects
    points: List[TimeSeriesPoint] = []
    for idx, row in df.iterrows():
        date_str = row[date_col].strftime("%Y-%m-%d")
        points.append(
            TimeSeriesPoint(
                date=date_str,
                actual=float(round(clean_series.iloc[idx], 2)),
                rolling_mean=float(round(rolling_series.iloc[idx], 2)),
                trend=float(round(trend_series[idx], 2)),
            )
        )

    return AnalyticsResponse(
        dataset_id=clean_id,
        date_column=date_col,
        target_column=target_col,
        rolling_window=window,
        points=points,
        statistics=stats,
        trend_direction=trend_direction,
        trend_slope=slope_float,
    )
