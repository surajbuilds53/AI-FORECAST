import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { getRecommendations, runPreprocessing } from '../api/preprocessing';

export default function PreprocessingPage({
  currentDataset,
  preprocessedData,
  setPreprocessedData,
  onNavigate
}) {
  const [recommendations, setRecommendations] = useState(null);
  const [selectedDateCol, setSelectedDateCol] = useState('');
  const [selectedTargetCol, setSelectedTargetCol] = useState('');
  const [missingStrategy, setMissingStrategy] = useState('forward_fill');
  const [includeCalendar, setIncludeCalendar] = useState(true);
  const [includeLags, setIncludeLags] = useState(true);
  const [includeRolling, setIncludeRolling] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch column recommendations when currentDataset changes
  useEffect(() => {
    if (!currentDataset?.id && !currentDataset?.filename) return;
    const targetId = currentDataset.id || currentDataset.filename;

    const fetchRecs = async () => {
      try {
        const recs = await getRecommendations(targetId);
        setRecommendations(recs);
        if (recs.recommended_datetime_column) {
          setSelectedDateCol(recs.recommended_datetime_column);
        } else if (recs.all_columns?.length > 0) {
          setSelectedDateCol(recs.all_columns[0]);
        }

        if (recs.recommended_target_column) {
          setSelectedTargetCol(recs.recommended_target_column);
        } else if (recs.all_numeric_columns?.length > 0) {
          setSelectedTargetCol(recs.all_numeric_columns[0]);
        }
      } catch (err) {
        // Fallback to columns from currentDataset
        if (currentDataset.columns) {
          const dateC = currentDataset.columns.find((c) =>
            c.inferred_type === 'Datetime' || c.name.toLowerCase().includes('date')
          )?.name || currentDataset.columns[0]?.name;
          const targetC = currentDataset.columns.find((c) =>
            c.inferred_type === 'Numeric' && c.name !== dateC
          )?.name;
          if (dateC) setSelectedDateCol(dateC);
          if (targetC) setSelectedTargetCol(targetC);
        }
      }
    };

    fetchRecs();
  }, [currentDataset]);

  const handleRunPreprocessing = async () => {
    if (!currentDataset) {
      setErrorMessage('Select a dataset and configure the date and target columns first.');
      return;
    }
    if (!selectedDateCol || !selectedTargetCol) {
      setErrorMessage('Please select both a date column and a numeric target column.');
      return;
    }
    if (selectedDateCol === selectedTargetCol) {
      setErrorMessage('Date column and target column cannot be identical.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await runPreprocessing({
        dataset_id: currentDataset.id || currentDataset.filename,
        datetime_column: selectedDateCol,
        target_column: selectedTargetCol,
        missing_value_strategy: missingStrategy,
        include_calendar_features: includeCalendar,
        include_lag_features: includeLags,
        include_rolling_mean: includeRolling,
      });
      setPreprocessedData(response);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Preprocessing failed.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Preprocessing
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Clean the dataset and create features for forecasting.
        </p>
      </div>

      {/* ERROR STATE */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Preprocessing failed.</span>
            <span className="text-xs text-red-600 mt-0.5 block">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs font-semibold text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1 — INPUT DATA */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Input Data
        </h2>

        {currentDataset ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-1">
            <div>
              <span className="text-xs text-slate-500 block">Dataset</span>
              <span className="font-medium text-slate-900 truncate block mt-0.5" title={currentDataset.filename}>
                {currentDataset.filename}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Rows</span>
              <span className="font-medium text-slate-900 block mt-0.5">
                {currentDataset.row_count?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Date Column</span>
              <select
                value={selectedDateCol}
                onChange={(e) => setSelectedDateCol(e.target.value)}
                className="mt-0.5 w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {currentDataset.columns?.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Target Column</span>
              <select
                value={selectedTargetCol}
                onChange={(e) => setSelectedTargetCol(e.target.value)}
                className="mt-0.5 w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {currentDataset.columns?.filter((c) => c.name !== selectedDateCol).map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-2">
            Select a dataset and configure the date and target columns first.{' '}
            <button
              onClick={() => onNavigate('datasets')}
              className="text-blue-600 hover:underline font-medium ml-1"
            >
              Go to Datasets
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2 — DATA CLEANING */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Missing Values
        </h2>

        <div className="max-w-md space-y-1.5">
          <label className="text-xs font-medium text-slate-700 block">
            Handling Strategy
          </label>
          <select
            value={missingStrategy}
            onChange={(e) => setMissingStrategy(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="forward_fill">Forward fill (Propagate past values)</option>
            <option value="backward_fill">Backward fill (Propagate next values)</option>
            <option value="mean">Mean imputation</option>
            <option value="median">Median imputation</option>
            <option value="drop">Drop rows with missing target</option>
          </select>
          <p className="text-xs text-slate-500 pt-0.5">
            Choose how missing observations should be handled before training.
          </p>
        </div>
      </div>

      {/* SECTION 3 — FEATURE ENGINEERING */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Features
        </h2>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeCalendar}
              onChange={(e) => setIncludeCalendar(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-900 block">Calendar Features</span>
              <span className="text-xs text-slate-500 block">
                Extract information such as day, month and weekday from the date.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeLags}
              onChange={(e) => setIncludeLags(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-900 block">Lag Features</span>
              <span className="text-xs text-slate-500 block">
                Use previous observations as model inputs.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeRolling}
              onChange={(e) => setIncludeRolling(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-900 block">Rolling Features</span>
              <span className="text-xs text-slate-500 block">
                Calculate statistics over previous observations.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* SECTION 4 — PREPROCESS BUTTON */}
      <div>
        <button
          onClick={handleRunPreprocessing}
          disabled={isLoading || !currentDataset}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Run Preprocessing'}
        </button>
      </div>

      {/* SECTION 5 — RESULT */}
      {preprocessedData && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Preprocessing Result
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Rows Before</span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {preprocessedData.original_rows?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Rows After</span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {preprocessedData.cleaned_rows?.toLocaleString()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block">Features Created</span>
                <span className="font-medium text-slate-900 block mt-0.5 text-xs font-mono break-words">
                  {preprocessedData.created_features?.length > 0
                    ? preprocessedData.created_features.join(', ')
                    : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Processed Data Preview */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Processed Data Preview
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Showing first {preprocessedData.preview_rows?.length || 0} rows
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 font-medium font-sans">
                  <tr>
                    {preprocessedData.columns?.map((col) => (
                      <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {preprocessedData.preview_rows?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {preprocessedData.columns?.map((col) => (
                        <td key={col} className="py-2 px-3 whitespace-nowrap">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
