import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  AlertCircle,
  ArrowRight,
  RotateCw,
  Calendar,
  Layers
} from 'lucide-react';
import { getModelsComparison } from '../api/evaluation';
import { getTrainedModels } from '../api/models';
import { generateForecast, getForecastExportUrl } from '../api/forecast';
import ForecastChart from '../charts/ForecastChart';

export default function ForecastPage({ 
  latestForecast, 
  setLatestForecast, 
  onNavigate 
}) {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [horizon, setHorizon] = useState(14);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [forecastResult, setForecastResult] = useState(latestForecast || null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const loadModels = async () => {
    setLoadingModels(true);
    setError(null);
    try {
      // First try comparison to identify recommended model
      const compData = await getModelsComparison().catch(() => null);
      if (compData && compData.models && compData.models.length > 0) {
        setModels(compData.models);
        const bestId = compData.best_model_id || compData.models[0].model_id;
        setSelectedModelId(bestId);
        if (!latestForecast) {
          await runForecast(bestId, 14, 0.95);
        }
      } else {
        const rawModels = await getTrainedModels();
        setModels(rawModels);
        if (rawModels.length > 0) {
          setSelectedModelId(rawModels[0].model_id);
          if (!latestForecast) {
            await runForecast(rawModels[0].model_id, 14, 0.95);
          }
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
      if (setLatestForecast) {
        setLatestForecast(res);
      }
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

  if (loadingModels) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <RotateCw className="w-7 h-7 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-xs font-mono">Loading model architectures and preparing forecast engine...</p>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-1">No Trained Models Available</h2>
        <p className="text-sm text-slate-500 mb-6">
          Train at least one model on the Models page before generating future forecasts.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('models')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <span>Go to Models</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const activeModel = models.find((m) => m.model_id === selectedModelId);
  const firstForecastDate = forecastResult?.forecast_points?.[0]?.date || '-';
  const lastForecastDate = forecastResult?.forecast_points?.[forecastResult.forecast_points.length - 1]?.date || '-';
  const lastHistoricalDate = forecastResult?.historical_points?.[forecastResult.historical_points.length - 1]?.date || '-';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Forecasts</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate predictions for future dates using a trained model.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-500 hover:text-red-700 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1 & 2: Forecast Settings and Generate Action */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Forecast Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Model
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            >
              {models.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.model_name} {m.is_best ? '(Recommended)' : ''}
                </option>
              ))}
            </select>
            {activeModel?.is_best && (
              <p className="text-[11px] text-blue-600 font-medium">Recommended based on lowest validation RMSE</p>
            )}
          </div>

          {/* Forecast Horizon */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Forecast Horizon
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[7, 14, 30].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizon(h)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    horizon === h
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {h} days
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">Number of days into the future to predict</p>
          </div>

          {/* Confidence Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Confidence Level
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '80%', val: 0.80 },
                { label: '95%', val: 0.95 },
                { label: '99%', val: 0.99 },
              ].map((c) => (
                <button
                  key={c.val}
                  type="button"
                  onClick={() => setConfidenceLevel(c.val)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    confidenceLevel === c.val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Wider interval means higher certainty that the actual value will fall within the range.
            </p>
          </div>
        </div>

        {/* Section 2: Generate Forecast Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Selected: <span className="font-medium text-slate-700">{activeModel?.model_name || 'Model'}</span> for <span className="font-medium text-slate-700">+{horizon} days</span> at <span className="font-medium text-slate-700">{Math.round(confidenceLevel * 100)}% CI</span>.
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Generating forecast...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Generate Forecast</span>
              </>
            )}
          </button>
        </div>
      </div>

      {forecastResult && (
        <>
          {/* Section 4: Forecast Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <div className="text-[11px] text-slate-500">Horizon</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{forecastResult.forecast_horizon} days</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <div className="text-[11px] text-slate-500">Model</div>
              <div className="text-sm font-semibold text-slate-900 truncate mt-0.5">{forecastResult.model_name}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <div className="text-[11px] text-slate-500">Last Historical Date</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{lastHistoricalDate}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <div className="text-[11px] text-slate-500">First Forecast Date</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{firstForecastDate}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500">Last Forecast Date</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{lastForecastDate}</div>
            </div>
          </div>

          {/* Section 3: Forecast Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Future Forecast</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Projected {forecastResult.target_column} for the next {forecastResult.forecast_horizon} days with {Math.round(forecastResult.confidence_level * 100)}% confidence intervals.
              </p>
            </div>

            <ForecastChart
              historicalPoints={forecastResult.historical_points}
              forecastPoints={forecastResult.forecast_points}
              targetName={forecastResult.target_column}
              modelName={forecastResult.model_name}
              confidenceLevel={forecastResult.confidence_level}
            />
          </div>

          {/* Section 5: Forecast Data Table & Export */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Forecasted Values</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recursive step-by-step projection table
                </p>
              </div>

              <a
                href={getForecastExportUrl(selectedModelId, horizon, confidenceLevel)}
                download
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </a>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right font-mono">Lower Bound ({Math.round(confidenceLevel * 100)}%)</th>
                    <th className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">Predicted Value</th>
                    <th className="px-4 py-2.5 text-right font-mono">Upper Bound ({Math.round(confidenceLevel * 100)}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {forecastResult.forecast_points.map((pt) => {
                    const pred = Number(pt.predicted);
                    const lower = Number(pt.lower_bound);
                    const upper = Number(pt.upper_bound);
                    return (
                      <tr key={pt.step} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-slate-800">{pt.date}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{lower.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">{pred.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{upper.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
