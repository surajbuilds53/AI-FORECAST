import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Calendar, 
  Hash, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Table, 
  Layers, 
  Clock, 
  TrendingUp, 
  Info,
  ArrowRight,
  Database,
  ListChecks
} from 'lucide-react';
import { getRecommendations, runPreprocessing } from '../api/preprocessing';

export default function PreprocessingPage({ 
  currentDataset, 
  preprocessedData, 
  setPreprocessedData,
  onNavigateToDatasets
}) {
  const [recommendations, setRecommendations] = useState(null);
  const [selectedDateCol, setSelectedDateCol] = useState('');
  const [selectedTargetCol, setSelectedTargetCol] = useState('');
  const [missingStrategy, setMissingStrategy] = useState('forward_fill');
  const [includeCalendar, setIncludeCalendar] = useState(true);
  const [includeLags, setIncludeLags] = useState(true);
  const [includeRolling, setIncludeRolling] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRecs, setIsFetchingRecs] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load column recommendations whenever the active dataset changes
  useEffect(() => {
    if (!currentDataset?.id) return;

    const fetchRecs = async () => {
      setIsFetchingRecs(true);
      setErrorMessage('');
      try {
        const recs = await getRecommendations(currentDataset.id);
        setRecommendations(recs);
        if (recs.recommended_datetime_column) {
          setSelectedDateCol(recs.recommended_datetime_column);
        } else if (recs.all_columns.length > 0) {
          setSelectedDateCol(recs.all_columns[0]);
        }

        if (recs.recommended_target_column) {
          setSelectedTargetCol(recs.recommended_target_column);
        } else if (recs.all_numeric_columns.length > 0) {
          setSelectedTargetCol(recs.all_numeric_columns[0]);
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.detail || 'Failed to load column recommendations');
      } finally {
        setIsFetchingRecs(false);
      }
    };

    fetchRecs();
  }, [currentDataset]);

  const handleExecute = async () => {
    if (!currentDataset?.id) {
      setErrorMessage('Please upload or select a dataset first.');
      return;
    }
    if (!selectedDateCol) {
      setErrorMessage('Please select a datetime column.');
      return;
    }
    if (!selectedTargetCol) {
      setErrorMessage('Please select a numeric target variable.');
      return;
    }
    if (selectedDateCol === selectedTargetCol) {
      setErrorMessage('The date column and target variable cannot be the same.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await runPreprocessing({
        dataset_id: currentDataset.id,
        datetime_column: selectedDateCol,
        target_column: selectedTargetCol,
        missing_value_strategy: missingStrategy,
        include_calendar_features: includeCalendar,
        include_lag_features: includeLags,
        include_rolling_mean: includeRolling,
      });
      setPreprocessedData(response);
      setSuccessMessage(
        `Preprocessing completed! Engineered ${response.features_created.length} new predictive features.`
      );
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Preprocessing execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentDataset) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
          <Database className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">No Dataset Active</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please upload a CSV dataset or load the demo sample on the Datasets page before running the preprocessing pipeline.
        </p>
        <button
          onClick={onNavigateToDatasets}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          Go to Datasets Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
          <Sliders className="w-3.5 h-3.5" />
          <span>Milestone 3 Active</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Time-Series Data Preprocessing & Feature Engineering
        </h1>
        <p className="text-sm text-slate-400">
          Enforce chronological ordering, handle missing entries safely, and engineer lag & rolling features for ML training.
        </p>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white text-xs font-bold">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1 & 2: Column Selection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-mono">1</span>
            <span>Target & Datetime Variables</span>
          </div>

          {/* Datetime Column */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Datetime Column
              </span>
              <span className="text-[10px] text-slate-500">For chronological sort</span>
            </label>
            <select
              value={selectedDateCol}
              onChange={(e) => setSelectedDateCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              {recommendations?.all_columns.map((col) => (
                <option key={col} value={col}>
                  {col} {recommendations.all_datetime_columns.includes(col) ? '📅 (Inferred Date)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Target Column */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                Target Variable (Y)
              </span>
              <span className="text-[10px] text-slate-500">To be predicted</span>
            </label>
            <select
              value={selectedTargetCol}
              onChange={(e) => setSelectedTargetCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              {recommendations?.all_numeric_columns.map((col) => (
                <option key={col} value={col}>
                  {col} {col === recommendations.recommended_target_column ? '⭐ (Recommended)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            💡 The engine will strictly sort rows by <span className="font-mono text-amber-300">{selectedDateCol || 'date'}</span> ascending to prevent look-ahead bias during training.
          </div>
        </div>

        {/* Step 3: Imputation Strategy */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-mono">2</span>
            <span>Missing Value Treatment</span>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'forward_fill', label: 'Forward Fill (Last Known Value)', desc: 'Carries previous valid observation forward in time (standard for time series).' },
              { id: 'backward_fill', label: 'Backward Fill (Next Valid Value)', desc: 'Propagates future observation backwards to fill nulls.' },
              { id: 'mean', label: 'Mean Imputation', desc: 'Replaces missing values with the column average.' },
              { id: 'median', label: 'Median Imputation', desc: 'Robust against extreme outliers in numeric data.' },
              { id: 'drop', label: 'Drop Missing Rows', desc: 'Discards any row containing missing target values.' },
            ].map((strat) => (
              <label
                key={strat.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  missingStrategy === strat.id
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="missing_strategy"
                  value={strat.id}
                  checked={missingStrategy === strat.id}
                  onChange={(e) => setMissingStrategy(e.target.value)}
                  className="mt-1 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-medium text-slate-200">{strat.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{strat.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Step 4: Feature Engineering Options */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-white mb-4">
              <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-mono">3</span>
              <span>Automated Feature Engineering</span>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCalendar}
                  onChange={(e) => setIncludeCalendar(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Calendar Temporal Features
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Generates year, month, day, day of week, quarter, and weekend flag.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLags}
                  onChange={(e) => setIncludeLags(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Autoregressive Lag Features
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Generates <span className="font-mono">target_lag_1</span> (yesterday) and <span className="font-mono">target_lag_7</span> (weekly cycle).
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRolling}
                  onChange={(e) => setIncludeRolling(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    Rolling Window Statistics
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Generates <span className="font-mono">target_rolling_mean_7</span> (7-period smoothed trend).
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleExecute}
            disabled={isLoading || isFetchingRecs}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Chronological Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Run Preprocessing Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preprocessed Results & Explainable Audit Log */}
      {preprocessedData && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Observations</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{preprocessedData.processed_rows.toLocaleString()}</div>
              <p className="text-[11px] text-emerald-400 mt-0.5">Chronologically ordered</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Features Available</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{preprocessedData.processed_columns}</div>
              <p className="text-[11px] text-indigo-400 mt-0.5">+{preprocessedData.features_created.length} engineered</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Variable</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono truncate">{preprocessedData.target_column}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Mean: {preprocessedData.summary_stats.mean}</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Range</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                {preprocessedData.summary_stats.min} – {preprocessedData.summary_stats.max}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Std Dev: {preprocessedData.summary_stats.std}</p>
            </div>
          </div>

          {/* Explainable Step-by-Step Audit Log (Viva Demonstration Core Feature) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-400" />
                  Explainable Transformation Audit Log
                </h3>
                <p className="text-xs text-slate-400">Exact sequence of mathematical and temporal operations performed</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                {preprocessedData.steps_log.length} Steps Verified
              </span>
            </div>

            <div className="p-5 space-y-3">
              {preprocessedData.steps_log.map((step) => (
                <div 
                  key={step.step_number} 
                  className="flex items-start gap-4 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                    {step.step_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-white">{step.step_name}</h4>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> {step.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{step.description}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">{step.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transformed Data Preview Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-400" />
                  Preprocessed Feature Matrix Preview (First 10 Rows)
                </h3>
                <p className="text-xs text-slate-400">Engineered calendar, lag, and rolling features appended to feature space</p>
              </div>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                Saved: {preprocessedData.preprocessed_dataset_id}
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 w-12 text-center">#</th>
                    {Object.keys(preprocessedData.preview_rows[0] || {}).map((col) => {
                      const isEngineered = preprocessedData.features_created.includes(col);
                      const isTarget = col === preprocessedData.target_column;
                      const isDate = col === preprocessedData.datetime_column;

                      return (
                        <th 
                          key={col} 
                          className={`px-4 py-3 whitespace-nowrap ${
                            isEngineered 
                              ? 'text-indigo-300 bg-indigo-950/20' 
                              : isTarget 
                                ? 'text-emerald-400 bg-emerald-950/20' 
                                : isDate 
                                  ? 'text-amber-300 bg-amber-950/20' 
                                  : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col}</span>
                            {isEngineered && <span className="text-[9px] px-1 rounded bg-indigo-600/30 text-indigo-300 font-sans">feat</span>}
                            {isTarget && <span className="text-[9px] px-1 rounded bg-emerald-600/30 text-emerald-300 font-sans">target</span>}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {preprocessedData.preview_rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 text-center text-[11px] bg-slate-950/40">{rIdx + 1}</td>
                      {Object.keys(preprocessedData.preview_rows[0] || {}).map((col) => {
                        const isEngineered = preprocessedData.features_created.includes(col);
                        return (
                          <td 
                            key={col} 
                            className={`px-4 py-2.5 whitespace-nowrap ${
                              isEngineered ? 'bg-indigo-950/10 text-indigo-200' : ''
                            }`}
                          >
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NaN'}
                          </td>
                        );
                      })}
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
