import React, { useState } from 'react';
import {
  HelpCircle,
  Calculator,
  Layers,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Server,
  Cpu,
  Code2
} from 'lucide-react';

export default function VivaGuidePage({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('questions');
  const [expandedIndex, setExpandedIndex] = useState(0);

  const questions = [
    {
      q: 'Why did you use chronological train/test splitting instead of random K-Fold cross-validation?',
      category: 'Data Leakage & Validation',
      badge: 'Critical Concept',
      a: 'In time-series data, observations possess strong temporal auto-correlation. If data is randomly shuffled into K-folds, future observations (e.g., day t+5) end up in the training set while past observations (e.g., day t+1) end up in the test set. This creates look-ahead bias (data leakage), artificially inflating metrics while guaranteeing failure in live production. We strictly enforce shuffle=False (earliest 80% train, subsequent 20% validation).',
    },
    {
      q: 'Why choose Linear Regression and Random Forest instead of traditional ARIMA or deep learning LSTMs?',
      category: 'Model Architecture',
      badge: 'Algorithm Selection',
      a: 'Linear Regression serves as an essential, highly interpretable baseline with sub-millisecond execution. Random Forest Regressor excels at capturing non-linear calendar seasonality, holiday spikes, and feature interactions without requiring strict stationarity (which ARIMA requires). While LSTMs require tens of thousands of continuous sequences to avoid severe overfitting, Random Forests achieve outstanding generalization on typical business time series (100–5,000 rows) using bootstrap aggregation.',
    },
    {
      q: 'What is the exact mathematical difference between MAE and RMSE? Why prioritize RMSE?',
      category: 'Evaluation Metrics',
      badge: 'Loss Functions',
      a: 'MAE measures the average absolute error linearly: (1/n) Σ |y - ŷ|. It penalizes all deviations proportionally. RMSE squares errors before taking the root: sqrt((1/n) Σ (y - ŷ)²). Because of squaring, RMSE disproportionately penalizes large forecast blunders. In demand planning, small deviations are manageable, but massive spike misses trigger catastrophic supply shortages; thus, RMSE is our primary ranking metric.',
    },
    {
      q: 'Can the R² score be negative on the validation split? What does it mean?',
      category: 'Evaluation Metrics',
      badge: 'Diagnostics',
      a: 'Yes. On held-out validation data, R² = 1 - (SS_res / SS_tot). If the model overfits and its residual sum of squares exceeds the total variance of the actual data, R² becomes negative. A negative R² indicates the model performs worse than simply predicting the historical mean (ȳ) for every future point.',
    },
    {
      q: 'How does your multi-step recursive forecasting engine work step-by-step?',
      category: 'Inference Engine',
      badge: 'Autoregression',
      a: 'At future step t+1, ground truth is unavailable. The engine: 1) calculates future calendar attributes (day of week, month), 2) pulls previous historical observations into lag_1 and lag_7 features, 3) predicts ŷ_{t+1}, 4) recursively appends ŷ_{t+1} back into the buffer, 5) uses ŷ_{t+1} as the lag_1 input for step t+2, continuing iteratively up to the full forecast horizon H.',
    },
    {
      q: 'How do you compute prediction intervals for deterministic Scikit-learn models?',
      category: 'Uncertainty Estimation',
      badge: 'Confidence Bounds',
      a: 'Because Scikit-learn regressors do not output Bayesian distributions natively, we apply parametric empirical error propagation based on the validation RMSE. As the forecast horizon extends into the future, forecast entropy compounds: σ(h) = RMSE * sqrt(1 + 0.10 * (h - 1)). Bounds are computed as ŷ ± z * σ(h), where z=1.96 for 95% confidence and z=1.28 for 80% confidence.',
    },
  ];

  const formulas = [
    {
      name: 'Mean Absolute Error (MAE)',
      math: 'MAE = (1 / n) * Σ |y_i - ŷ_i|',
      units: 'Target Units (e.g. Sales / Units)',
      desc: 'Average absolute magnitude of point forecast errors. Robust to single extreme outliers.',
    },
    {
      name: 'Mean Squared Error (MSE)',
      math: 'MSE = (1 / n) * Σ (y_i - ŷ_i)²',
      units: 'Squared Target Units',
      desc: 'Quadratic scoring metric that heavily penalizes large individual prediction deviations.',
    },
    {
      name: 'Root Mean Squared Error (RMSE)',
      math: 'RMSE = √[ (1 / n) * Σ (y_i - ŷ_i)² ]',
      units: 'Target Units',
      desc: 'Standard deviation of prediction residuals. Primary ranking criteria on held-out validation data.',
    },
    {
      name: 'Coefficient of Determination (R²)',
      math: 'R² = 1 - [ Σ (y_i - ŷ_i)² / Σ (y_i - ȳ)² ]',
      units: 'Dimensionless (-∞ to 1.0)',
      desc: 'Proportion of target variance explained by the engineered features. 1.0 = perfect prediction.',
    },
    {
      name: 'Compounding Horizon Uncertainty',
      math: 'σ(h) = RMSE * √[ 1 + α * (h - 1) ]',
      units: 'Target Units (α = 0.10)',
      desc: 'Compounds forecast uncertainty proportionally to future horizon step h, causing confidence intervals to expand over time.',
    },
  ];

  const demoSteps = [
    { step: 1, title: 'Dashboard Overview', desc: 'Point out active system status, dataset summary, and sequential forecasting workflow.' },
    { step: 2, title: 'Datasets Ingestion', desc: 'Click "Load Sample Sales Dataset" (120 daily records) and inspect detected date/numeric columns.' },
    { step: 3, title: 'Preprocessing & Feature Engineering', desc: 'Execute preprocessing; demonstrate chronological sorting, missing value imputation, and lag/rolling feature creation.' },
    { step: 4, title: 'Time-Series Analytics', desc: 'Inspect historical time series chart, toggle 7-day and 14-day moving averages, and review summary statistics.' },
    { step: 5, title: 'Model Training', desc: 'Train Linear Regression baseline and Random Forest Regressor; explain the 80/20 chronological split with shuffle=False.' },
    { step: 6, title: 'Model Evaluation', desc: 'Review the comparison table; explain why the model with lower RMSE is recommended for future predictions.' },
    { step: 7, title: 'Future Forecasting', desc: 'Generate 14-day future predictions; show the continuous transition from history to future with expanding confidence bounds and export CSV.' },
    { step: 8, title: 'Viva & Architecture Reference', desc: 'Demonstrate this Viva & Documentation Hub and answer theoretical questions posed by the examiner.' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Viva & Documentation</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Technical reference, examiner Q&A, mathematical formulations, and project demonstration guide.
        </p>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'questions', label: 'Examiner Q&A (6 Core)', icon: HelpCircle },
          { id: 'formulas', label: 'Mathematical Formulations', icon: Calculator },
          { id: 'architecture', label: 'System Architecture', icon: Layers },
          { id: 'demo', label: '5-Min Live Demo Script', icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content: Examiner Q&A */}
      {activeSubTab === 'questions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>High-frequency university viva examination questions with model answers.</span>
            <span className="font-mono text-blue-600">Click any card to expand</span>
          </div>

          <div className="space-y-3">
            {questions.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                  className={`cursor-pointer rounded-lg border transition-all p-4 ${
                    isExpanded
                      ? 'bg-white border-blue-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                        Q{idx + 1}: {item.q}
                      </h3>
                    </div>
                    <div className="p-1 rounded bg-slate-100 text-slate-500 shrink-0 mt-1">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed space-y-1.5">
                      <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                        Model Answer for Examiner:
                      </div>
                      <p className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-slate-800">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content: Mathematical Formulations */}
      {activeSubTab === 'formulas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formulas.map((f, idx) => (
            <div
              key={idx}
              className="p-5 rounded-lg bg-white border border-slate-200 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">{f.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {f.units}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 text-center font-semibold">
                {f.math}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Content: System Architecture */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">FastAPI Backend</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Python REST API with Pydantic schema validation, OpenAPI docs at <code className="text-blue-700 bg-slate-100 px-1 py-0.5 rounded">/docs</code>, and modular routers.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Scikit-learn ML Engine</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Chronological splitting, Linear Regression & Random Forest regressors, standard validation metrics, and recursive lag feature generation.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">React 18 + Vite Frontend</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Single-page application styled with Tailwind CSS, Recharts for interactive time-series charts, and an application Error Boundary.
              </p>
            </div>
          </div>

          {/* ASCII Architecture Pipeline */}
          <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2 shadow-sm">
            <div className="text-xs font-semibold text-slate-900">End-to-End Pipeline Architecture</div>
            <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto leading-relaxed p-3 bg-slate-50 rounded-lg border border-slate-200">
{`Raw CSV Ingestion ──▶ Validation & Chronological Sort ──▶ Imputation (ffill)
                                                                 │
      ┌──────────────────────────────────────────────────────────┘
      ▼
Feature Engineering: Lag Features (t-1, t-7) + Calendar (dayofweek, month)
      │
      ▼
Chronological Train (80%) / Test (20%) Split [shuffle=False]
      │
      ├───────────────────────────────┐
      ▼                               ▼
Linear Regression (Baseline)    Random Forest Regressor (Ensemble)
      │                               │
      └───────────────┬───────────────┘
                      ▼
Evaluation: MAE, RMSE, R² Comparison (Select Lowest RMSE)
                      │
                      ▼
Recursive Multi-Step Forecasting (14 Days) + Compounding Prediction Intervals`}
            </pre>
          </div>
        </div>
      )}

      {/* Content: 5-Minute Live Demo Script */}
      {activeSubTab === 'demo' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between">
            <span>Recommended step-by-step walkthrough for your college project viva presentation.</span>
            <span className="font-semibold">Duration: ~5 Minutes</span>
          </div>

          <div className="space-y-2.5">
            {demoSteps.map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-lg bg-white border border-slate-200 flex items-start gap-3.5 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-slate-900">{s.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
