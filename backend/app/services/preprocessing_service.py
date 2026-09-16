import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
import numpy as np
import pandas as pd
from fastapi import HTTPException, status
from app.schemas.preprocessing import (
    PreprocessingRequest,
    PreprocessingStepLog,
    PreprocessingResponse,
    ColumnRecommendations,
)
from app.services.dataset_service import DATASETS_DIR, infer_column_type


def get_column_recommendations(dataset_id: str) -> ColumnRecommendations:
    """Recommends default datetime and numeric target columns based on dataset profiling."""
    clean_id = os.path.basename(dataset_id)
    target_path = DATASETS_DIR / clean_id

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{dataset_id}' not found.",
        )

    try:
        df = pd.read_csv(target_path, nrows=50)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not read dataset: {str(e)}",
        )

    datetime_cols: List[str] = []
    numeric_cols: List[str] = []
    all_cols = list(df.columns)

    for col in all_cols:
        col_type = infer_column_type(df[col])
        if col_type == "datetime":
            datetime_cols.append(str(col))
        elif col_type == "numeric":
            numeric_cols.append(str(col))

    # Identify best default datetime column (prefer 'date', 'datetime', 'time', 'timestamp')
    rec_date = None
    for dt_candidate in datetime_cols:
        if any(keyword in dt_candidate.lower() for keyword in ["date", "time", "day", "timestamp"]):
            rec_date = dt_candidate
            break
    if not rec_date and datetime_cols:
        rec_date = datetime_cols[0]

    # Identify best default target column (prefer 'sales', 'target', 'demand', 'price', 'value')
    rec_target = None
    for num_candidate in numeric_cols:
        if any(keyword in num_candidate.lower() for keyword in ["sales", "target", "demand", "price", "value", "count"]):
            rec_target = num_candidate
            break
    if not rec_target and numeric_cols:
        rec_target = numeric_cols[0]

    return ColumnRecommendations(
        dataset_id=clean_id,
        recommended_datetime_column=rec_date,
        all_datetime_columns=datetime_cols,
        recommended_target_column=rec_target,
        all_numeric_columns=numeric_cols,
        all_columns=all_cols,
    )


def execute_preprocessing(request: PreprocessingRequest) -> PreprocessingResponse:
    """
    Executes chronological time-series preprocessing:
    1. Datetime parsing and validation
    2. Strictly chronological sorting ascending
    3. Target numeric validation
    4. Missing-value strategy execution
    5. Feature engineering (calendar, lag, rolling statistics)
    6. Produces explainable audit step logs and saved preprocessed dataset.
    """
    clean_id = os.path.basename(request.dataset_id)
    target_path = DATASETS_DIR / clean_id

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{request.dataset_id}' not found.",
        )

    try:
        df = pd.read_csv(target_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset file: {str(e)}",
        )

    original_rows, original_cols = df.shape
    steps_log: List[PreprocessingStepLog] = []
    created_features: List[str] = []

    # Step 1: Ingestion
    steps_log.append(
        PreprocessingStepLog(
            step_number=1,
            step_name="Dataset Ingestion",
            description="Loaded source dataset into memory",
            details=f"Ingested {original_rows:,} rows across {original_cols} columns from '{clean_id}'",
        )
    )

    # Step 2: Validate and Convert Datetime
    dt_col = request.datetime_column
    if dt_col not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Datetime column '{dt_col}' does not exist in dataset. Available: {list(df.columns)}",
        )

    try:
        parsed_dt = pd.to_datetime(df[dt_col], errors="coerce")
        if parsed_dt.isna().all():
            raise ValueError("All values in datetime column failed parsing.")
        df[dt_col] = parsed_dt
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse datetime column '{dt_col}': {str(e)}",
        )

    steps_log.append(
        PreprocessingStepLog(
            step_number=2,
            step_name="Datetime Parsing",
            description=f"Converted '{dt_col}' to ISO datetime objects",
            details="Verified timestamps for chronological ordering",
        )
    )

    # Step 3: Chronological Sorting (Critical for Time Series ML)
    df = df.sort_values(by=dt_col, ascending=True).reset_index(drop=True)
    steps_log.append(
        PreprocessingStepLog(
            step_number=3,
            step_name="Chronological Sorting",
            description="Sorted observations strictly by timestamp ascending",
            details=f"Sequence guaranteed from {df[dt_col].min().strftime('%Y-%m-%d')} to {df[dt_col].max().strftime('%Y-%m-%d')} (no random shuffling)",
        )
    )

    # Step 4: Validate Target Column
    target_col = request.target_column
    if target_col not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target column '{target_col}' not found in dataset.",
        )

    if target_col == dt_col:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The target variable cannot be the same as the datetime column.",
        )

    try:
        df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target column '{target_col}' must be numeric: {str(e)}",
        )

    steps_log.append(
        PreprocessingStepLog(
            step_number=4,
            step_name="Target Variable Validation",
            description=f"Verified target '{target_col}' as numeric float",
            details=f"Range: [{df[target_col].min():.2f} to {df[target_col].max():.2f}], Mean: {df[target_col].mean():.2f}",
        )
    )

    # Step 5: Missing Value Imputation
    initial_nulls = int(df.isna().sum().sum())
    strat = request.missing_value_strategy.lower()

    if strat == "forward_fill":
        df = df.ffill().bfill()
        strat_desc = "Applied Forward Fill (propagated past valid values, backfilled remaining)"
    elif strat == "backward_fill":
        df = df.bfill().ffill()
        strat_desc = "Applied Backward Fill (propagated next valid values)"
    elif strat == "mean":
        num_cols = df.select_dtypes(include=[np.number]).columns
        df[num_cols] = df[num_cols].fillna(df[num_cols].mean())
        df = df.ffill().bfill()  # handle categorical nulls
        strat_desc = "Imputed missing numeric values with column mean"
    elif strat == "median":
        num_cols = df.select_dtypes(include=[np.number]).columns
        df[num_cols] = df[num_cols].fillna(df[num_cols].median())
        df = df.ffill().bfill()
        strat_desc = "Imputed missing numeric values with column median"
    elif strat == "drop":
        df = df.dropna(subset=[target_col]).reset_index(drop=True)
        strat_desc = f"Dropped rows with missing target values (retained {len(df)} rows)"
    else:
        df = df.ffill().bfill()
        strat_desc = "Applied default Forward Fill"

    remaining_nulls = int(df.isna().sum().sum())
    steps_log.append(
        PreprocessingStepLog(
            step_number=5,
            step_name="Missing Value Handling",
            description=strat_desc,
            details=f"Cleaned {initial_nulls} missing cells -> {remaining_nulls} remaining nulls",
        )
    )

    # Step 6: Calendar Feature Engineering
    if request.include_calendar_features:
        cal_features = [
            (f"{dt_col}_year", df[dt_col].dt.year),
            (f"{dt_col}_month", df[dt_col].dt.month),
            (f"{dt_col}_day", df[dt_col].dt.day),
            (f"{dt_col}_dayofweek", df[dt_col].dt.dayofweek),
            (f"{dt_col}_quarter", df[dt_col].dt.quarter),
            (f"{dt_col}_is_weekend", df[dt_col].dt.dayofweek.isin([5, 6]).astype(int)),
        ]
        for name, series in cal_features:
            df[name] = series
            created_features.append(name)

        steps_log.append(
            PreprocessingStepLog(
                step_number=6,
                step_name="Calendar Feature Engineering",
                description="Extracted cyclic temporal features from datetime",
                details=f"Generated: {', '.join([f[0] for f in cal_features])}",
            )
        )

    # Step 7: Lag Feature Engineering (Target Lags t-1, t-7)
    if request.include_lag_features:
        lag1_name = f"{target_col}_lag_1"
        lag7_name = f"{target_col}_lag_7"
        df[lag1_name] = df[target_col].shift(1).bfill()
        df[lag7_name] = df[target_col].shift(7).bfill()
        created_features.extend([lag1_name, lag7_name])

        steps_log.append(
            PreprocessingStepLog(
                step_number=7,
                step_name="Lag Feature Engineering",
                description="Engineered historical memory features from target",
                details=f"Created '{lag1_name}' (immediate previous value) and '{lag7_name}' (weekly cycle value)",
            )
        )

    # Step 8: Rolling Statistics
    if request.include_rolling_mean:
        roll7_name = f"{target_col}_rolling_mean_7"
        df[roll7_name] = df[target_col].rolling(window=7, min_periods=1).mean()
        created_features.append(roll7_name)

        steps_log.append(
            PreprocessingStepLog(
                step_number=8,
                step_name="Rolling Mean Statistics",
                description="Calculated moving window trend baseline",
                details=f"Created '{roll7_name}' using 7-period trailing window (smoothed trend)",
            )
        )

    # Format datetime back to string for storage and JSON serialization
    df_to_save = df.copy()
    df_to_save[dt_col] = df_to_save[dt_col].dt.strftime("%Y-%m-%d")

    # Persist preprocessed dataset
    base_name = clean_id.replace(".csv", "")
    preprocessed_filename = f"{base_name}_preprocessed.csv"
    preprocessed_path = DATASETS_DIR / preprocessed_filename
    df_to_save.to_csv(preprocessed_path, index=False)

    # Calculate summary statistics for target
    target_series = df[target_col]
    summary_stats = {
        "target_column": target_col,
        "count": int(target_series.count()),
        "mean": float(round(target_series.mean(), 2)),
        "std": float(round(target_series.std(), 2)),
        "min": float(round(target_series.min(), 2)),
        "max": float(round(target_series.max(), 2)),
        "q25": float(round(target_series.quantile(0.25), 2)),
        "median": float(round(target_series.median(), 2)),
        "q75": float(round(target_series.quantile(0.75), 2)),
    }

    # Format top 10 preview rows
    preview_df = df_to_save.head(10).replace({np.nan: None})
    preview_rows = preview_df.to_dict(orient="records")

    return PreprocessingResponse(
        dataset_id=clean_id,
        preprocessed_dataset_id=preprocessed_filename,
        datetime_column=dt_col,
        target_column=target_col,
        original_rows=original_rows,
        processed_rows=len(df),
        original_columns=original_cols,
        processed_columns=len(df.columns),
        features_created=created_features,
        steps_log=steps_log,
        preview_rows=preview_rows,
        summary_stats=summary_stats,
        processed_at=datetime.now(timezone.utc).isoformat(),
    )
