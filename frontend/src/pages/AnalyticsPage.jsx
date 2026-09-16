import React, { useState, useEffect } from 'react';
import { AlertCircle, LineChart as ChartIcon } from 'lucide-react';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { fetchAnalyticsData } from '../api/analytics';
import { getRecommendations } from '../api/preprocessing';

export default function AnalyticsPage({ currentDataset, onNavigate }) {
  const [selectedDateCol, setSelectedDateCol] = useState('');
  const [selectedTargetCol, setSelectedTargetCol] = useState('');
  const [rollingWindow, setRollingWindow] = useState(7);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initial column selection
  useEffect(() => {
    if (!currentDataset?.id && !currentDataset?.filename) return;
    const targetId = currentDataset.id || currentDataset.filename;

    const fetchCols = async () => {
      try {
        const recs = await getRecommendations(targetId);
        const initDate = recs.recommended_datetime_column || (recs.all_columns?.[0] || 'date');
        const initTarget = recs.recommended_target_column || (recs.all_numeric_columns?.[0] || 'sales');
        setSelectedDateCol(initDate);
        setSelectedTargetCol(initTarget);
      } catch (err) {
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

    fetchCols();
  }, [currentDataset]);

  // Query analytics data
  useEffect(() => {
    const targetId = currentDataset?.id || currentDataset?.filename;
    if (!targetId || !selectedDateCol || !selectedTargetCol) return;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await fetchAnalyticsData({
          dataset_id: targetId,
          date_column: selectedDateCol,
          target_column: selectedTargetCol,
          rolling_window: rollingWindow,
        });
        setAnalyticsData(data);
      } catch (err) {
        setErrorMessage(err.response?.data?.detail || err.message || 'Failed to compute analytics');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentDataset, selectedDateCol, selectedTargetCol, rollingWindow]);

  if (!currentDataset) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3 max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
          <ChartIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">
          No data available
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Load a dataset to view historical trends.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('datasets')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go to Datasets
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats from analyticsData or fallback
  const stats = analyticsData?.statistics;
  const points = analyticsData?.time_series_points || [];
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore historical trends and patterns in the selected time series.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Could not load analytics.</span>
            <span className="text-xs text-red-600 mt-0.5 block">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* SECTION 1 — CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Target Variable:
              </label>
              <select
                value={selectedTargetCol}
                onChange={(e) => setSelectedTargetCol(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
              >
                {currentDataset.columns?.filter((c) => c.name !== selectedDateCol).map((col) => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Moving Average Window:
              </label>
              <div className="flex items-center gap-1">
                {[7, 14, 30].map((w) => (
                  <button
                    key={w}
                    onClick={() => setRollingWindow(w)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      rollingWindow === w
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {w}D
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {currentDataset.filename}
          </div>
        </div>
      </div>

      {/* SECTION 3 — TREND / SUMMARY */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-medium">Minimum</div>
            <div className="text-lg font-semibold text-slate-900 mt-1">
              {stats.min?.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-medium">Maximum</div>
            <div className="text-lg font-semibold text-slate-900 mt-1">
              {stats.max?.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-medium">Mean</div>
            <div className="text-lg font-semibold text-slate-900 mt-1">
              {stats.mean?.toFixed(2)}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-medium">Latest Value</div>
            <div className="text-lg font-semibold text-slate-900 mt-1">
              {latestPoint ? latestPoint.actual?.toLocaleString() : '—'}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2 & 4 — MAIN TIME-SERIES CHART */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Historical Time Series
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Target: {selectedTargetCol}
          </span>
        </div>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center text-xs text-slate-500 font-mono">
            Loading time series data...
          </div>
        ) : (
          <TimeSeriesChart
            data={points}
            targetName={selectedTargetCol}
            dateName={selectedDateCol}
            windowSize={rollingWindow}
          />
        )}
      </div>
    </div>
  );
}
