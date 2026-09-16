import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Zap,
  Activity,
  ChevronRight,
  Sliders,
  Scale
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

  // Load models comparison on mount
  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getModelsComparison();
      setComparison(data);
      if (data.models && data.models.length > 0) {
        // Default to best model or first model
        const targetId = data.best_model_id || data.models[0].model_id;
        setSelectedModelId(targetId);
        await fetchModelEvaluation(targetId);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load model comparison.');
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
      console.error('Failed to load model evaluation:', err);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm font-mono">Computing evaluation metrics on validation partitions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>Evaluation Error</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchComparison}
          className="px-4 py-2 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/30 rounded-xl text-xs font-mono transition-colors"
        >
          Retry Evaluation
        </button>
      </div>
    );
  }

  if (!comparison || !comparison.models || comparison.models.length === 0) {
    return (
      <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-5 max-w-xl mx-auto my-12">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Scale className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">No Trained Models to Evaluate</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Evaluation requires at least one trained machine learning model with out-of-sample validation predictions.
            Train a baseline or random forest model in Milestone 5 first.
          </p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('models')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25"
        >
          <span>Go to Model Training</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const bestModel = comparison.models.find((m) => m.model_id === comparison.best_model_id);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1.5 uppercase tracking-wider">
            <span>Milestone 6</span>
            <span>•</span>
            <span>Out-Of-Sample Validation Benchmarking</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-indigo-400" />
            Model Evaluation & Benchmarking
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real mathematical validation metrics (MAE, MSE, RMSE, R²) computed on held-out chronological test sets.
          </p>
        </div>
        <button
          onClick={fetchComparison}
          className="self-start sm:self-center px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Benchmark</span>
        </button>
      </div>

      {/* Best Model Recommendation Banner */}
      {bestModel && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-emerald-950/30 border border-indigo-500/30 p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Award className="w-4 h-4" />
                <span>Top Performing Architecture on Validation Split</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {bestModel.model_name}
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
                {comparison.evaluation_summary}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
              <div className="text-center px-3 border-r border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Lowest RMSE</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{bestModel.rmse}</div>
              </div>
              <div className="text-center px-3">
                <div className="text-[10px] uppercase font-mono text-slate-400">Highest R²</div>
                <div className="text-xl font-black text-indigo-400 font-mono mt-0.5">{bestModel.r2}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span>
              <strong className="text-slate-300">Viva Defense Concept:</strong> Models are evaluated strictly on the out-of-sample validation split to detect overfitting. A lower RMSE and higher R² indicate superior generalization ability to unseen future data.
            </span>
          </div>
        </div>
      )}

      {/* Model Comparison Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Comparative Leaderboard ({comparison.models.length} Models)</span>
          </h2>
          <span className="text-xs text-slate-400">Ranked by RMSE (Ascending)</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-mono">
                <th className="py-3 px-4">Rank / Model</th>
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-4 text-right">MAE</th>
                <th className="py-3 px-4 text-right">RMSE</th>
                <th className="py-3 px-4 text-right">R² Score</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {comparison.models.map((model, idx) => {
                const isSelected = selectedModelId === model.model_id;
                return (
                  <tr
                    key={model.model_id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-sans font-medium text-white flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <span>{model.model_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 uppercase text-[11px]">
                      {model.model_type.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300 font-bold">
                      {model.mae.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                      {model.rmse.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-indigo-400 font-bold">
                      {model.r2.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {model.is_best ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Top Performer
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Benchmark</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleSelectModel(model.model_id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Inspecting' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Inspector */}
      {selectedModelId && evaluationData && (
        <div className="space-y-6 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-indigo-400 uppercase">Detailed Analysis</div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{evaluationData.model_name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                  Target: {evaluationData.target_column}
                </span>
              </h2>
            </div>

            {/* Model Selector Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
              {comparison.models.map((m) => (
                <button
                  key={m.model_id}
                  onClick={() => handleSelectModel(m.model_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedModelId === m.model_id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.model_name}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MAE */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Mean Absolute Error</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">MAE</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {evaluationData.metrics.mae.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Average magnitude of forecast errors in identical units to the target variable.
              </p>
            </div>

            {/* MSE */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Mean Squared Error</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">MSE</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {evaluationData.metrics.mse.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Quadratic loss metric penalizing larger individual forecasting deviations heavily.
              </p>
            </div>

            {/* RMSE */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Root Mean Squared Error</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                  RMSE
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {evaluationData.metrics.rmse.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Square root of MSE; measures standard deviation of prediction residuals.
              </p>
            </div>

            {/* R2 */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>R² Score (Variance)</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] border border-indigo-500/20">
                  R²
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-400 font-mono">
                {evaluationData.metrics.r2.toFixed(4)}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Proportion of variance in {evaluationData.target_column} explained by features (1.0 = optimal).
              </p>
            </div>
          </div>

          {/* Actual vs Predicted Chart */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Actual vs Predicted Validation Curve</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison between true historical validation points and out-of-sample model predictions.
                </p>
              </div>
            </div>

            {evalLoading ? (
              <div className="h-80 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : (
              <ActualVsPredictedChart
                predictions={evaluationData.predictions}
                targetName={evaluationData.target_column}
                modelName={evaluationData.model_name}
              />
            )}
          </div>

          {/* Residual Analysis Preview */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Validation Residuals Breakdown ({evaluationData.predictions.length} Data Points)
            </h4>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800/80">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Actual ({evaluationData.target_column})</th>
                    <th className="py-2 px-3 text-right">Predicted</th>
                    <th className="py-2 px-3 text-right">Residual (Error)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {evaluationData.predictions.map((pt, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-1.5 px-3 text-slate-400">{pt.date}</td>
                      <td className="py-1.5 px-3 text-right">{pt.actual.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right text-emerald-400">{pt.predicted.toFixed(2)}</td>
                      <td
                        className={`py-1.5 px-3 text-right font-bold ${
                          pt.residual > 0 ? 'text-amber-400' : 'text-blue-400'
                        }`}
                      >
                        {pt.residual > 0 ? `+${pt.residual.toFixed(2)}` : pt.residual.toFixed(2)}
                      </td>
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
