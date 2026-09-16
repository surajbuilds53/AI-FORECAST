import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Upload, FileText } from 'lucide-react';
import { loadSampleDataset, uploadDataset, getDatasets } from '../api/dataset';
import { getTrainedModels } from '../api/models';

export default function Dashboard({
  backendStatus = { healthy: false },
  currentDataset,
  setCurrentDataset,
  trainedModels = [],
  latestForecast,
  onNavigate
}) {
  const [modelCount, setModelCount] = useState(trainedModels.length);
  const [loadingSample, setLoadingSample] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Sync real model count
  useEffect(() => {
    let isMounted = true;
    getTrainedModels()
      .then((models) => {
        if (isMounted && Array.isArray(models)) {
          setModelCount(models.length);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [trainedModels]);

  const handleLoadSample = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      const data = await loadSampleDataset();
      if (setCurrentDataset) setCurrentDataset(data);
      onNavigate('datasets');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sample dataset.');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const data = await uploadDataset(file);
      if (setCurrentDataset) setCurrentDataset(data);
      onNavigate('datasets');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload CSV dataset.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const detectedDateCol = currentDataset?.detected_datetime_column || currentDataset?.columns?.find((c) =>
    c.inferred_type === 'Datetime' || ['date', 'time', 'timestamp', 'day'].some((k) => c.name.toLowerCase().includes(k))
  )?.name || '—';

  const detectedTargetCol = currentDataset?.columns?.find((c) =>
    c.inferred_type === 'Numeric' && c.name !== detectedDateCol
  )?.name || '—';

  const forecastText = latestForecast?.forecast_horizon
    ? `+${latestForecast.forecast_horizon} days generated`
    : 'Not generated';

  return (
    <div className="space-y-8">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI Forecast
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-0.5">
            Time-Series Forecasting & Analysis
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Upload a dataset, prepare the time-series data, train forecasting models, evaluate their performance, and generate future predictions.
          </p>
        </div>

        <div className="self-start md:self-center shrink-0">
          {backendStatus.healthy ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              API Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              API Disconnected
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SECTION 1 — PROJECT STATUS */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Project Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-medium">Dataset</div>
            <div className="text-lg font-semibold text-slate-900 mt-1 truncate" title={currentDataset?.filename || 'None'}>
              {currentDataset?.filename || 'None'}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-medium">Rows</div>
            <div className="text-lg font-semibold text-slate-900 mt-1">
              {currentDataset?.row_count ? currentDataset.row_count.toLocaleString() : '—'}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-medium">Trained Models</div>
            <div className="text-lg font-semibold text-slate-900 mt-1">
              {modelCount}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-medium">Forecast</div>
            <div className="text-lg font-semibold text-slate-900 mt-1 truncate">
              {forecastText}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — GET STARTED */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Get Started
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Start with a dataset and follow the forecasting workflow.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={handleLoadSample}
            disabled={loadingSample}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingSample ? 'Loading Sample...' : 'Load Sample Dataset'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {/* SECTION 3 — WORKFLOW */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Forecasting Workflow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { num: '01', title: 'Dataset', text: 'Load or upload time-series data.', tab: 'datasets' },
            { num: '02', title: 'Preprocess', text: 'Clean the data and create useful features.', tab: 'preprocessing' },
            { num: '03', title: 'Train Model', text: 'Train a forecasting model on historical data.', tab: 'models' },
            { num: '04', title: 'Evaluate', text: 'Compare predictions with known values.', tab: 'evaluation' },
            { num: '05', title: 'Forecast', text: 'Generate predictions for future dates.', tab: 'forecasts' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => onNavigate(s.tab)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 text-left transition-colors group"
            >
              <div className="text-xs font-mono font-semibold text-slate-400 group-hover:text-blue-600">
                {s.num}
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {s.title}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {s.text}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4 — CURRENT DATASET */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Current Dataset
        </h2>
        {currentDataset ? (
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Dataset Name</span>
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
                <span className="text-xs text-slate-500 block">Columns</span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {currentDataset.column_count}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Date Column</span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {detectedDateCol}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Target Column</span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {detectedTargetCol}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => onNavigate('datasets')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Open Dataset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center space-y-3">
            <p className="text-sm font-medium text-slate-800">
              No dataset loaded
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload a CSV file or load the sample dataset to begin.
            </p>
            <button
              onClick={() => onNavigate('datasets')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Go to Datasets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
