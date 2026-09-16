import React, { useState, useEffect } from 'react';
import { 
  LineChart as ChartIcon, 
  Calendar, 
  Hash, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  AlertTriangle, 
  Layers, 
  BarChart2, 
  Database,
  Info
} from 'lucide-react';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { fetchAnalyticsData } from '../api/analytics';
import { getRecommendations } from '../api/preprocessing';

export default function AnalyticsPage({ currentDataset, onNavigateToDatasets }) {
  const [recommendations, setRecommendations] = useState(null);
  const [selectedDateCol, setSelectedDateCol] = useState('');
  const [selectedTargetCol, setSelectedTargetCol] = useState('');
  const [rollingWindow, setRollingWindow] = useState(7);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial column recommendations when dataset loads
  useEffect(() => {
    if (!currentDataset?.id) return;

    const fetchCols = async () => {
      try {
        const recs = await getRecommendations(currentDataset.id);
        setRecommendations(recs);

        const initialDate = recs.recommended_datetime_column || (recs.all_columns[0] || 'date');
        const initialTarget = recs.recommended_target_column || (recs.all_numeric_columns[0] || 'sales');

        setSelectedDateCol(initialDate);
        setSelectedTargetCol(initialTarget);
      } catch (err) {
        console.error('Failed to load column recommendations:', err);
      }
    };

    fetchCols();
  }, [currentDataset]);

  // Query analytics data whenever dataset, date, target, or window changes
  useEffect(() => {
    if (!currentDataset?.id || !selectedDateCol || !selectedTargetCol) return;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await fetchAnalyticsData({
          dataset_id: currentDataset.id,
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
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
          <Database className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">No Dataset Active</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please upload a CSV dataset or load the demo sample on the Datasets page before exploring analytics and charts.
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

  const renderTrendBadge = (direction, slope) => {
    if (direction === 'Increasing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Increasing (+{slope}/period)</span>
        </span>
      );
    }
    if (direction === 'Decreasing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Decreasing ({slope}/period)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Minus className="w-3.5 h-3.5" />
        <span>Stable Trend</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
          <ChartIcon className="w-3.5 h-3.5" />
          <span>Milestone 4 Active</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Interactive Time-Series Analytics & Trends
        </h1>
        <p className="text-sm text-slate-400">
          Explore dynamic historical trajectories, moving average smoothing, and mathematical trendline fits.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Date Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Time / Date Dimension</span>
            </label>
            <select
              value={selectedDateCol}
              onChange={(e) => setSelectedDateCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              {recommendations?.all_columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Target Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Variable (Metric)</span>
            </label>
            <select
              value={selectedTargetCol}
              onChange={(e) => setSelectedTargetCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              {recommendations?.all_numeric_columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Rolling Window Pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Moving Average Window</span>
            </label>
            <div className="flex gap-2">
              {[3, 7, 14, 30].map((w) => (
                <button
                  key={w}
                  onClick={() => setRollingWindow(w)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border font-mono transition-colors ${
                    rollingWindow === w
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {w}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      {analyticsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mean Average</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {analyticsData.statistics.mean.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Central tendency</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Standard Deviation</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              ±{analyticsData.statistics.std.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Volatility metric</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Observed Range</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono truncate">
              {analyticsData.statistics.min.toLocaleString()} – {analyticsData.statistics.max.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Min to Max span</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fitted Trend</span>
            <div className="mt-1">
              {renderTrendBadge(analyticsData.trend_direction, analyticsData.trend_slope)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Least-squares slope</p>
          </div>
        </div>
      )}

      {/* Main Interactive Chart Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-indigo-400" />
              <span>Time-Series Trajectory: {selectedTargetCol}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive timeline with moving average smoothing and least-squares regression trend
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Recalculating...</span>
            </div>
          )}
        </div>

        <TimeSeriesChart
          data={analyticsData?.points || []}
          targetName={selectedTargetCol}
          dateName={selectedDateCol}
          windowSize={rollingWindow}
        />
      </div>

      {/* Statistical Distribution Table */}
      {analyticsData && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl shadow-black/20">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Descriptive Statistical Moments</h3>
            <p className="text-xs text-slate-400">Comprehensive dataset statistics for academic and viva presentation</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Median (Q2)</span>
              <div className="text-base font-bold text-white font-mono mt-1">{analyticsData.statistics.median.toLocaleString()}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Variance (σ²)</span>
              <div className="text-base font-bold text-white font-mono mt-1">{analyticsData.statistics.variance.toLocaleString()}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Skewness</span>
              <div className="text-base font-bold text-white font-mono mt-1">{analyticsData.statistics.skewness}</div>
              <span className="text-[10px] text-slate-500">
                {analyticsData.statistics.skewness > 0 ? 'Right-skewed' : 'Left-skewed'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Kurtosis</span>
              <div className="text-base font-bold text-white font-mono mt-1">{analyticsData.statistics.kurtosis}</div>
              <span className="text-[10px] text-slate-500">Tailedness</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">25th Percentile (Q1)</span>
              <div className="text-base font-bold text-white font-mono mt-1">{analyticsData.statistics.q25.toLocaleString()}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">75th Percentile (Q3)</span>
              <div className="text-base font-bold text-white font-mono mt-1">{analyticsData.statistics.q75.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
