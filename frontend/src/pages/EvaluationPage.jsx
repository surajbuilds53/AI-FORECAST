import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { getModelsComparison, getModelEvaluation } from '../api/evaluation';
import ActualVsPredictedChart from '../charts/ActualVsPredictedChart';

export default function EvaluationPage({ onNavigate }) {
  const [comparison, setComparison] = useState(null);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [evaluationData, setEvaluationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalLoading, setEvalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMetricsGuide, setShowMetricsGuide] = useState(false);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getModelsComparison();
      setComparison(data);
      if (data.models && data.models.length > 0) {
        const targetId = data.best_model_id || data.models[0].model_id;
        setSelectedModelId(targetId);
        await fetchModelEvaluation(targetId);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load model evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const fetchModelEvaluation = async (modelId) => {
    setEvalLoading(true);
    try {
      const data = await getModelEvaluation(modelId);
      setEvaluationData(data);
    } catch (err) {
      console.error('Failed to load model evaluation details:', err);
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const handleSelectModel = (modelId) => {
    setSelectedModelId(modelId);
    fetchModelEvaluation(modelId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <RotateCw className="w-7 h-7 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-xs font-mono">Calculating validation metrics on holdout test set...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-red-700 space-y-3 max-w-2xl mx-auto my-6">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>Evaluation Error</span>
        </div>
        <p className="text-xs">{error}</p>
        <button
          onClick={fetchComparison}
          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!comparison || !comparison.models || comparison.models.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <BarChart2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-1">No Models Trained Yet</h2>
        <p className="text-sm text-slate-500 mb-6">
          Train at least one model on the Models page to view performance evaluation and comparisons.
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

  const bestModel = comparison.models.find((m) => m.model_id === comparison.best_model_id) || comparison.models[0];
  const otherModel = comparison.models.find((m) => m.model_id !== bestModel.model_id);
  const selectedModel = comparison.models.find((m) => m.model_id === selectedModelId) || bestModel;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Model Evaluation</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Compare model performance on the holdout test set to select the best forecasting model.
          </p>
        </div>
        <button
          onClick={fetchComparison}
          className="self-start sm:self-auto px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Section 1: Model Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm space-y-0">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Model Comparison</h2>
          <span className="text-xs text-slate-500">Evaluated on chronological 20% holdout</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-5 py-2.5">Model</th>
                <th className="px-5 py-2.5 text-right font-mono">MAE</th>
                <th className="px-5 py-2.5 text-right font-mono">RMSE</th>
                <th className="px-5 py-2.5 text-right font-mono">R² Score</th>
                <th className="px-5 py-2.5 text-right font-mono">Training Time</th>
                <th className="px-5 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {comparison.models.map((m) => {
                const isBest = m.model_id === comparison.best_model_id;
                return (
                  <tr
                    key={m.model_id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isBest ? 'border-l-4 border-l-blue-600 bg-blue-50/20' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{m.model_name}</span>
                        {isBest && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            Recommended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-700">
                      {m.mae?.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900">
                      {m.rmse?.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-700">
                      {m.r2?.toFixed(4)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-500">
                      {m.training_time_ms ? `${m.training_time_ms} ms` : '-'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-[11px] text-slate-500">
                        {isBest ? 'Lowest Error' : 'Baseline'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Callout text below table */}
        {bestModel && otherModel && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>{bestModel.model_name}</strong> achieved lower RMSE ({bestModel.rmse?.toFixed(2)} vs {otherModel.rmse?.toFixed(2)}), making it the recommended model for generating future forecasts.
            </span>
          </div>
        )}
      </div>

      {/* Section 2: Actual vs Predicted Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Test Set: Actual vs. Predicted</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing model predictions against actual values on the 20% holdout test set.
            </p>
          </div>

          {/* Model Selector & Metric Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {comparison.models.map((m) => (
                <button
                  key={m.model_id}
                  onClick={() => handleSelectModel(m.model_id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedModelId === m.model_id
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m.model_name}
                </button>
              ))}
            </div>

            {selectedModel && (
              <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
                <span>MAE: <strong>{selectedModel.mae?.toFixed(2)}</strong></span>
                <span className="text-slate-300">|</span>
                <span>RMSE: <strong>{selectedModel.rmse?.toFixed(2)}</strong></span>
                <span className="text-slate-300">|</span>
                <span>R²: <strong>{selectedModel.r2?.toFixed(4)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {evalLoading ? (
          <div className="h-72 flex items-center justify-center">
            <RotateCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : evaluationData ? (
          <ActualVsPredictedChart
            predictions={evaluationData.predictions}
            targetName={evaluationData.target_column}
            modelName={evaluationData.model_name}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-mono">
            Select a model above to view predictions.
          </div>
        )}
      </div>

      {/* Section 3: Understanding the Metrics */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setShowMetricsGuide(!showMetricsGuide)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Understanding the Metrics</h3>
          </div>
          {showMetricsGuide ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showMetricsGuide && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600 leading-relaxed">
            <div>
              <strong className="text-slate-800">MAE (Mean Absolute Error):</strong> Average prediction error in the same units as the target variable. Easy to interpret — tells you how far off predictions are on average.
            </div>
            <div>
              <strong className="text-slate-800">RMSE (Root Mean Squared Error):</strong> Similar to MAE, but penalizes large errors more heavily due to squaring. Standard metric for model comparison.
            </div>
            <div>
              <strong className="text-slate-800">R² Score (Coefficient of Determination):</strong> Proportion of variance explained by the model. 1.0 = perfect fit, 0.0 = baseline (predicts the mean), negative = worse than predicting the mean.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
