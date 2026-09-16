import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Download,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sliders,
  ShieldAlert,
  Layers,
  FileSpreadsheet,
  Cpu,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { getModelsComparison } from '../api/evaluation';
import { getTrainedModels } from '../api/models';
import { generateForecast, getForecastExportUrl } from '../api/forecast';
import ForecastChart from '../charts/ForecastChart';

export default function ForecastPage({ onNavigate }) {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [horizon, setHorizon] = useState(14);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [forecastResult, setForecastResult] = useState(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available models
  const loadModels = async () => {
    setLoadingModels(true);
    setError(null);
    try {
      // First try comparison to get recommendation
      const compData = await getModelsComparison().catch(() => null);
      if (compData && compData.models && compData.models.length > 0) {
        setModels(compData.models);
        const bestId = compData.best_model_id || compData.models[0].model_id;
        setSelectedModelId(bestId);
        // Automatically trigger initial forecast with recommended model
        await runForecast(bestId, 14, 0.95);
      } else {
        // Fallback to trained models list
        const rawModels = await getTrainedModels();
        setModels(rawModels);
        if (rawModels.length > 0) {
          setSelectedModelId(rawModels[0].model_id);
          await runForecast(rawModels[0].model_id, 14, 0.95);
        }
      }
    } catch (err) {
      setError('Failed to load trained models.');
    } finally {
      setLoadingModels(false);
    }
  };

  const runForecast = async (modelId, horizonDays, conf) => {
    if (!modelId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateForecast({
        model_id: modelId,
        forecast_horizon: Number(horizonDays),
        confidence_level: Number(conf),
      });
      setForecastResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate forecast.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleGenerate = () => {
    runForecast(selectedModelId, horizon, confidenceLevel);
  };

  const handleHorizonChange = (h) => {
    setHorizon(h);
    if (selectedModelId) {
      runForecast(selectedModelId, h, confidenceLevel);
    }
  };

  const handleConfidenceChange = (c) => {
    setConfidenceLevel(c);
    if (selectedModelId) {
      runForecast(selectedModelId, horizon, c);
    }
  };

  if (loadingModels) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-slate-400 text-sm font-mono">Loading model architectures and preparing predictive engine...</p>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-5 max-w-xl mx-auto my-12">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">No Trained Models Available</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Future forecasting requires a trained machine learning model artifact. Please train a Linear Regression or Random Forest model in Milestone 5 before projecting future predictions.
          </p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('models')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-600/25"
        >
          <span>Go to Model Training</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const activeModel = models.find((m) => m.model_id === selectedModelId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1.5 uppercase tracking-wider">
            <span>Milestone 7</span>
            <span>•</span>
            <span>Autoregressive Multi-Step Future Forecasting</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-purple-400" />
            Future Forecasting & Inference Engine
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Generate out-of-sample predictions with dynamic recursive feature propagation and empirical confidence intervals.
          </p>
        </div>

        {selectedModelId && (
          <a
            href={getForecastExportUrl(selectedModelId, horizon, confidenceLevel)}
            download
            className="self-start sm:self-center px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Forecast CSV</span>
          </a>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Forecasting Control Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Forecasting Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Selected ML Model</span>
              {activeModel?.is_best && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Recommended
                </span>
              )}
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => {
                setSelectedModelId(e.target.value);
                runForecast(e.target.value, horizon, confidenceLevel);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {models.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.model_name} {m.is_best ? '★ (Best RMSE)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Pick the trained model architecture to generate recursive predictions.
            </p>
          </div>

          {/* Horizon Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Forecast Horizon</span>
              <span className="text-purple-400 font-mono text-xs font-bold">+{horizon} Days</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map((h) => (
                <button
                  key={h}
                  onClick={() => handleHorizonChange(h)}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${
                    horizon === h
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Future time-steps to project chronologically.
            </p>
          </div>

          {/* Confidence Interval */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Uncertainty Interval</span>
              <span className="text-emerald-400 font-mono text-xs font-bold">{Math.round(confidenceLevel * 100)}% CI</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '80%', val: 0.80 },
                { label: '95%', val: 0.95 },
                { label: '99%', val: 0.99 },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => handleConfidenceChange(item.val)}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${
                    confidenceLevel === item.val
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Parametric error band derived from validation RMSE.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{isGenerating ? 'Computing Recursive Horizon...' : 'Recompute Forecast'}</span>
          </button>
        </div>
      </div>

      {/* Forecast Output */}
      {forecastResult && (
        <div className="space-y-6">
          {/* 4 Summary Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mean Forecast */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Average Forecast</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {forecastResult.summary.mean_forecast.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                Mean projected value over the next {forecastResult.forecast_horizon} days.
              </p>
            </div>

            {/* Projected Peak */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Projected Peak</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">MAX</span>
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {forecastResult.summary.max_forecast.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                Highest expected value within the forecasted horizon.
              </p>
            </div>

            {/* Projected Trough */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Projected Trough</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">MIN</span>
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {forecastResult.summary.min_forecast.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                Lowest expected point during the prediction window.
              </p>
            </div>

            {/* Projected Net Trend */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Trajectory Trend</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    forecastResult.summary.pct_change_from_last >= 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {forecastResult.summary.pct_change_from_last >= 0 ? '+' : ''}
                  {forecastResult.summary.pct_change_from_last}%
                </span>
              </div>
              <div className="text-base font-bold text-white font-mono truncate">
                {forecastResult.summary.trend_direction}
              </div>
              <p className="text-[11px] text-slate-500">
                Relative change from last historical observation ({forecastResult.summary.last_historical_value}).
              </p>
            </div>
          </div>

          {/* Interactive Continuous Chart */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Continuous Forecast Timeline</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical tail bridged directly into recursive future predictions with expanding uncertainty bounds.
                </p>
              </div>
            </div>

            <ForecastChart
              historicalPoints={forecastResult.historical_points}
              forecastPoints={forecastResult.forecast_points}
              targetName={forecastResult.target_column}
              modelName={forecastResult.model_name}
              confidenceLevel={forecastResult.confidence_level}
            />
          </div>

          {/* Viva Defense Explanation Card */}
          <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Viva Defense Technical Architecture: Autoregressive Recursive Multi-Step Forecasting</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {forecastResult.summary.viva_explanation}
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-slate-400 font-mono">
              <span>• Model: {forecastResult.model_name}</span>
              <span>• Target: {forecastResult.target_column}</span>
              <span>• Steps: +{forecastResult.forecast_horizon} days</span>
              <span>• Horizon Uncertainty: sigma(h) = RMSE * sqrt(1 + 0.1*(h-1))</span>
            </div>
          </div>

          {/* Forecast Data Table Preview */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Forecast Schedule Data ({forecastResult.forecast_points.length} Periods)</span>
              </h4>
              <a
                href={getForecastExportUrl(selectedModelId, horizon, confidenceLevel)}
                download
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </a>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800/80">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Step</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Forecast ({forecastResult.target_column})</th>
                    <th className="py-2.5 px-3 text-right">Lower Bound ({Math.round(confidenceLevel * 100)}%)</th>
                    <th className="py-2.5 px-3 text-right">Upper Bound ({Math.round(confidenceLevel * 100)}%)</th>
                    <th className="py-2.5 px-3 text-right">Interval Spread</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {forecastResult.forecast_points.map((pt) => {
                    const upper = Number(pt.upper_bound) || 0;
                    const lower = Number(pt.lower_bound) || 0;
                    const spread = (upper - lower).toFixed(1);
                    const halfSpread = (Number(spread) / 2).toFixed(1);
                    return (
                      <tr key={pt.step} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-500">+{pt.step}</td>
                        <td className="py-2 px-3 text-white font-medium">{pt.date}</td>
                        <td className="py-2 px-3 text-right text-purple-300 font-bold">{Number(pt.predicted).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{lower.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{upper.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400/80 font-mono">±{halfSpread}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
