import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Sliders, 
  Calendar, 
  Hash, 
  RefreshCw, 
  Database,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Info
} from 'lucide-react';
import { getAvailableModels, trainModel, getTrainedModels } from '../api/models';
import { getRecommendations } from '../api/preprocessing';

export default function ModelsPage({ 
  currentDataset, 
  trainedModels, 
  setTrainedModels, 
  onNavigateToDatasets 
}) {
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModelType, setSelectedModelType] = useState('linear_regression');
  const [selectedTargetCol, setSelectedTargetCol] = useState('');
  const [testSplitRatio, setTestSplitRatio] = useState(0.20);
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState(10);

  const [recommendations, setRecommendations] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load available models and previous training runs on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [modelsList, pastRuns] = await Promise.all([
          getAvailableModels(),
          getTrainedModels(),
        ]);
        setAvailableModels(modelsList);
        setTrainedModels(pastRuns);
      } catch (err) {
        console.error('Failed to load models data:', err);
      }
    };
    fetchMeta();
  }, [setTrainedModels]);

  // Load column recommendations for active dataset
  useEffect(() => {
    if (!currentDataset?.id) return;

    const fetchCols = async () => {
      try {
        const recs = await getRecommendations(currentDataset.id);
        setRecommendations(recs);

        const initialTarget = recs.recommended_target_column || (recs.all_numeric_columns[0] || 'sales');
        setSelectedTargetCol(initialTarget);

        // Pre-select all numeric columns except the target
        const candidateFeatures = recs.all_numeric_columns.filter((c) => c !== initialTarget);
        setSelectedFeatures(candidateFeatures);
      } catch (err) {
        console.error('Failed to load column recommendations:', err);
      }
    };

    fetchCols();
  }, [currentDataset]);

  const handleTrain = async () => {
    if (!currentDataset?.id) {
      setErrorMessage('Please select a dataset first.');
      return;
    }
    if (!selectedTargetCol) {
      setErrorMessage('Please choose a target variable to predict.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      dataset_id: currentDataset.id,
      target_column: selectedTargetCol,
      feature_columns: selectedFeatures.length > 0 ? selectedFeatures : null,
      model_type: selectedModelType,
      test_split_ratio: testSplitRatio,
      hyperparameters: selectedModelType === 'random_forest' 
        ? { n_estimators: nEstimators, max_depth: maxDepth }
        : {},
    };

    try {
      const result = await trainModel(payload);
      setSuccessMessage(
        `Success! Trained ${result.model_name} in ${result.training_time_ms} ms (${result.train_rows} train rows, ${result.val_rows} val rows).`
      );
      // Refresh registry
      const updatedRuns = await getTrainedModels();
      setTrainedModels(updatedRuns);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Model training failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = (feature) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
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
          Please upload a CSV dataset or load the demo sample on the Datasets page before training machine learning models.
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

  // Calculate row split previews based on current ratio
  const totalRows = currentDataset.row_count || 121;
  const valRows = Math.round(totalRows * testSplitRatio);
  const trainRows = totalRows - valRows;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
          <Cpu className="w-3.5 h-3.5" />
          <span>Milestone 5 Active</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Machine Learning Model Training Pipeline
        </h1>
        <p className="text-sm text-slate-400">
          Train real Scikit-learn forecasting models with strict chronological holdout splitting and performance telemetry.
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

      {/* Model Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Model 1: Linear Regression */}
        <div
          onClick={() => setSelectedModelType('linear_regression')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all ${
            selectedModelType === 'linear_regression'
              ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Statistical Baseline
            </span>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              selectedModelType === 'linear_regression' ? 'border-indigo-400 bg-indigo-600' : 'border-slate-600'
            }`}>
              {selectedModelType === 'linear_regression' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          <h3 className="text-base font-bold text-white">Linear Regression Baseline</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Fits an ordinary least-squares plane between time features and the target. Provides essential baseline benchmark coefficients for college viva evaluation.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant training (&lt; 20 ms)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero risk of tree overfitting</span>
            </div>
          </div>
        </div>

        {/* Model 2: Random Forest Regressor */}
        <div
          onClick={() => setSelectedModelType('random_forest')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all ${
            selectedModelType === 'random_forest'
              ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Non-Linear Ensemble Trees
            </span>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              selectedModelType === 'random_forest' ? 'border-indigo-400 bg-indigo-600' : 'border-slate-600'
            }`}>
              {selectedModelType === 'random_forest' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          <h3 className="text-base font-bold text-white">Random Forest Regressor</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Constructs an ensemble of randomized decision trees. Excels at learning non-linear seasonal cycles, weekend multipliers, and lag interactions.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Captures non-linear seasonality & interactions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resistant to individual observation outliers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Training Configuration Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl shadow-black/20">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Training Pipeline Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Variable Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Variable to Train (Y)</span>
            </label>
            <select
              value={selectedTargetCol}
              onChange={(e) => setSelectedTargetCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              {recommendations?.all_numeric_columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Chronological Validation Split */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Chronological Train / Validation Split</span>
              <span className="text-indigo-400 font-mono text-[11px]">
                {Math.round((1 - testSplitRatio) * 100)}% Train / {Math.round(testSplitRatio * 100)}% Val
              </span>
            </label>
            <div className="flex gap-2">
              {[
                { label: '80% / 20% (Standard)', val: 0.20 },
                { label: '70% / 30%', val: 0.30 },
                { label: '85% / 15%', val: 0.15 },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setTestSplitRatio(s.val)}
                  className={`flex-1 py-2 text-xs rounded-lg border font-mono transition-colors ${
                    testSplitRatio === s.val
                      ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chronological Partition Visualizer */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
              <span>Training Set: {trainRows} rows ({Math.round((1 - testSplitRatio) * 100)}%)</span>
            </span>
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
              <span>Validation Holdout: {valRows} rows ({Math.round(testSplitRatio * 100)}%)</span>
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-indigo-600 h-full" style={{ width: `${(1 - testSplitRatio) * 100}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${testSplitRatio * 100}%` }} />
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-emerald-400" />
            <span>Zero lookahead bias: observations are ordered chronologically without random shuffling.</span>
          </p>
        </div>

        {/* Hyperparameter Settings for Random Forest */}
        {selectedModelType === 'random_forest' && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Random Forest Hyperparameters
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Number of Trees (`n_estimators`): {nEstimators}</label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={nEstimators}
                  onChange={(e) => setNEstimators(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Max Depth (`max_depth`): {maxDepth}</label>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="1"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Feature Selection */}
        {recommendations && recommendations.all_numeric_columns.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">
              Input Features Selection (X Matrix)
            </label>
            <div className="flex flex-wrap gap-2">
              {recommendations.all_numeric_columns
                .filter((col) => col !== selectedTargetCol)
                .map((col) => {
                  const isSelected = selectedFeatures.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => toggleFeature(col)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {col} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Submit Train Button */}
        <button
          onClick={handleTrain}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Training Estimator on Chronological Data...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Train Forecasting Model</span>
            </>
          )}
        </button>
      </div>

      {/* Trained Models Registry Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Trained Models Registry ({trainedModels.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Serialized estimators ready for Milestone 6 evaluation and Milestone 7 future forecasting
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            {trainedModels.length} Saved Models
          </span>
        </div>

        {trainedModels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Model Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Train / Val Partition</th>
                  <th className="px-5 py-3">Features Used</th>
                  <th className="px-5 py-3">Training Duration</th>
                  <th className="px-5 py-3">Date Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {trainedModels.map((m) => (
                  <tr key={m.model_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{m.model_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{m.model_id}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <div>{m.train_rows} train / {m.val_rows} val</div>
                      <div className="text-[11px] text-slate-500">({m.total_rows} total rows)</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-indigo-300 border border-slate-700/60">
                        {m.features_used.length} features
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400">
                      {m.training_time_ms} ms
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                      <div>Train: {m.train_date_range}</div>
                      <div className="text-amber-400/80">Val: {m.val_date_range}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No models trained yet. Select an algorithm above and click "Train Forecasting Model".
          </div>
        )}
      </div>
    </div>
  );
}
