import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  ArrowRight, 
  Sliders, 
  Layers, 
  Database,
  Check
} from 'lucide-react';
import { getAvailableModels, trainModel, getTrainedModels } from '../api/models';
import { getRecommendations } from '../api/preprocessing';

export default function ModelsPage({ 
  currentDataset, 
  trainedModels = [], 
  setTrainedModels, 
  onNavigate,
  onNavigateToDatasets 
}) {
  const [selectedModelType, setSelectedModelType] = useState('linear_regression');
  const [selectedTargetCol, setSelectedTargetCol] = useState('');
  const [testSplitRatio, setTestSplitRatio] = useState(0.20);
  
  // Model-specific settings
  const [fitIntercept, setFitIntercept] = useState(true);
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState(10);

  const [recommendations, setRecommendations] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastTrainedResult, setLastTrainedResult] = useState(null);

  const navigateTo = (tab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (tab === 'datasets' && onNavigateToDatasets) {
      onNavigateToDatasets();
    }
  };

  // Load available models and previous training runs on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const pastRuns = await getTrainedModels();
        if (setTrainedModels) {
          setTrainedModels(pastRuns);
        }
      } catch (err) {
        console.error('Failed to load past runs:', err);
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
      setErrorMessage('Please select or upload a dataset first.');
      return;
    }
    if (!selectedTargetCol) {
      setErrorMessage('Please choose a target variable to predict.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const payload = {
      dataset_id: currentDataset.id,
      target_column: selectedTargetCol,
      feature_columns: selectedFeatures.length > 0 ? selectedFeatures : null,
      model_type: selectedModelType,
      test_split_ratio: testSplitRatio,
      hyperparameters: selectedModelType === 'random_forest' 
        ? { n_estimators: nEstimators, max_depth: maxDepth, random_state: 42 }
        : { fit_intercept: fitIntercept },
    };

    try {
      const result = await trainModel(payload);
      setLastTrainedResult(result);
      // Refresh registry
      const updatedRuns = await getTrainedModels();
      if (setTrainedModels) {
        setTrainedModels(updatedRuns);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Model training failed.');
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
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Database className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-1">No Dataset Loaded</h2>
        <p className="text-sm text-slate-500 mb-6">
          Please upload or load a dataset before training forecasting models.
        </p>
        <button
          onClick={() => navigateTo('datasets')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <span>Go to Datasets</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const totalRows = currentDataset.row_count || 100;
  const valRows = Math.round(totalRows * testSplitRatio);
  const trainRows = totalRows - valRows;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Models</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Train forecasting models using the processed time-series data.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button 
            onClick={() => setErrorMessage('')} 
            className="text-red-500 hover:text-red-700 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1: Available Models */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">1. Available Models</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model 1: Linear Regression */}
          <div
            onClick={() => setSelectedModelType('linear_regression')}
            className={`p-5 rounded-lg border cursor-pointer transition-all ${
              selectedModelType === 'linear_regression'
                ? 'bg-blue-50/40 border-blue-600 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="model_type"
                  checked={selectedModelType === 'linear_regression'}
                  onChange={() => setSelectedModelType('linear_regression')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="font-semibold text-sm text-slate-900">Linear Regression</span>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                Baseline
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Fast, interpretable linear model. Good for establishing baseline performance and understanding overall trend.
            </p>
            <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 space-y-1">
              <span className="font-medium text-slate-700">Strengths: </span>
              Trains instantly, easy to interpret coefficients, no hyperparameter tuning needed.
            </div>
          </div>

          {/* Model 2: Random Forest */}
          <div
            onClick={() => setSelectedModelType('random_forest')}
            className={`p-5 rounded-lg border cursor-pointer transition-all ${
              selectedModelType === 'random_forest'
                ? 'bg-blue-50/40 border-blue-600 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="model_type"
                  checked={selectedModelType === 'random_forest'}
                  onChange={() => setSelectedModelType('random_forest')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="font-semibold text-sm text-slate-900">Random Forest</span>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">
                Ensemble
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Ensemble of decision trees. Captures non-linear patterns and complex relationships between features.
            </p>
            <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 space-y-1">
              <span className="font-medium text-slate-700">Strengths: </span>
              Handles non-linear trends, resistant to overfitting, captures feature interactions.
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Model Settings */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span>2. Model Settings ({selectedModelType === 'linear_regression' ? 'Linear Regression' : 'Random Forest'})</span>
        </h2>

        {selectedModelType === 'linear_regression' ? (
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={fitIntercept}
                onChange={(e) => setFitIntercept(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>Fit intercept (calculate baseline offset)</span>
            </label>
            <p className="text-xs text-slate-500">
              Linear regression has no tunable hyperparameters. It fits an ordinary least squares line to the features.
            </p>
          </div>
        ) : (
          <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-medium text-slate-700">Number of trees (n_estimators)</label>
                  <span className="font-mono text-slate-600 font-semibold">{nEstimators}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={nEstimators}
                  onChange={(e) => setNEstimators(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>10</span>
                  <span>100 (Default)</span>
                  <span>200</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-medium text-slate-700">Maximum depth</label>
                  <span className="font-mono text-slate-600 font-semibold">{maxDepth}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">Limits tree depth to prevent overfitting</p>
              </div>
            </div>

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span>Random state: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] text-slate-700">42</code></span>
              <span className="text-[11px] text-slate-400">Fixed for reproducible results</span>
            </div>
          </div>
        )}

        {/* Feature and Target Selection */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Variable (to predict)
            </label>
            <select
              value={selectedTargetCol}
              onChange={(e) => setSelectedTargetCol(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            >
              {recommendations?.all_numeric_columns?.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Input Features ({selectedFeatures.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
              {recommendations?.all_numeric_columns
                ?.filter((c) => c !== selectedTargetCol)
                ?.map((col) => {
                  const isChecked = selectedFeatures.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => toggleFeature(col)}
                      className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                        isChecked
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}{col}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Validation Settings */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">3. Validation Settings</h2>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div>
            <span className="font-semibold text-slate-900">Train / Test Split: </span>
            <span className="text-slate-600 font-mono">80% train / 20% test</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
              <span>Train: {trainRows} rows</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-300 inline-block" />
              <span>Test: {valRows} rows</span>
            </span>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
          <div className="bg-blue-600 h-full" style={{ width: '80%' }} />
          <div className="bg-slate-300 h-full" style={{ width: '20%' }} />
        </div>

        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200">
          <strong>Validation Strategy:</strong> Uses chronological split (<code className="text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200">shuffle=False</code>). In time-series forecasting, we must train on past data and test on future data to avoid data leakage.
        </p>
      </div>

      {/* Section 4: Train Model Action */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-xs text-slate-500">
          Ready to train <span className="font-semibold text-slate-700">{selectedModelType === 'linear_regression' ? 'Linear Regression' : 'Random Forest'}</span> on {trainRows} chronological observations.
        </div>
        <button
          onClick={handleTrain}
          disabled={isLoading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Training...</span>
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              <span>Train Model</span>
            </>
          )}
        </button>
      </div>

      {/* Section 5: Training Result (appears after training) */}
      {lastTrainedResult && (
        <div className="bg-white border border-emerald-200 rounded-lg p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Model trained successfully</h3>
                <p className="text-xs text-slate-500">
                  {lastTrainedResult.model_name} trained in {(lastTrainedResult.training_time_ms / 1000).toFixed(2)}s ({lastTrainedResult.training_time_ms} ms)
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('evaluation')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Go to Evaluation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-[11px] text-slate-500">Training Rows</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{lastTrainedResult.train_rows}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-[11px] text-slate-500">Test Rows</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{lastTrainedResult.val_rows}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-[11px] text-slate-500">Features Used</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{lastTrainedResult.features_used?.length || 0} features</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-[11px] text-slate-500">Training Duration</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">{lastTrainedResult.training_time_ms} ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Table of all trained models */}
      {trainedModels.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Trained Models ({trainedModels.length})</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{trainedModels.length} models ready</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Model</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Partition</th>
                  <th className="px-4 py-2.5">Training Time</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {trainedModels.map((m) => (
                  <tr key={m.model_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{m.model_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{m.model_id}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {m.model_type}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {m.train_rows} train / {m.val_rows} test
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {m.training_time_ms} ms
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedModelType(m.model_type);
                          handleTrain();
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 rounded transition-colors cursor-pointer"
                      >
                        Train again
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
