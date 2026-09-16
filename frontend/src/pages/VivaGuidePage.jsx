import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  HelpCircle,
  Calculator,
  CheckSquare,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Database,
  TrendingUp,
  Server,
  Code2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function VivaGuidePage({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('questions');
  const [expandedIndex, setExpandedIndex] = useState(0);

  const questions = [
    {
      q: 'Why did you use chronological train/test splitting instead of random K-Fold cross-validation?',
      category: 'Data Leakage & Validation',
      badge: 'Critical Concept',
      badgeColor: 'rose',
      a: 'In time-series data, observations possess strong temporal auto-correlation. If data is randomly shuffled into K-folds, future observations (e.g., day t+5) end up in the training set while past observations (e.g., day t+1) end up in the test set. This creates look-ahead bias (data leakage), artificially inflating metrics while guaranteeing failure in live production. We strictly enforce shuffle=False (earliest 80% train, subsequent 20% validation).',
    },
    {
      q: 'Why choose Linear Regression and Random Forest instead of traditional ARIMA or deep learning LSTMs?',
      category: 'Model Architecture',
      badge: 'Algorithm Selection',
      badgeColor: 'purple',
      a: 'Linear Regression serves as an essential, highly interpretable baseline with sub-millisecond execution. Random Forest Regressor excels at capturing non-linear calendar seasonality, holiday spikes, and feature interactions without requiring strict stationarity (which ARIMA requires). While LSTMs require tens of thousands of continuous sequences to avoid severe overfitting, Random Forests achieve outstanding generalization on typical business time series (100–5,000 rows) using bootstrap aggregation.',
    },
    {
      q: 'What is the exact mathematical difference between MAE and RMSE? Why prioritize RMSE?',
      category: 'Evaluation Metrics',
      badge: 'Loss Functions',
      badgeColor: 'indigo',
      a: 'MAE measures the average absolute error linearly: (1/n) Σ |y - ŷ|. It penalizes all deviations proportionally. RMSE squares errors before taking the root: sqrt((1/n) Σ (y - ŷ)²). Because of squaring, RMSE disproportionately penalizes large forecast blunders. In demand planning, small deviations are manageable, but massive spike misses trigger catastrophic supply shortages; thus, RMSE is our primary ranking metric.',
    },
    {
      q: 'Can the R² score be negative on the validation split? What does it mean?',
      category: 'Evaluation Metrics',
      badge: 'Diagnostics',
      badgeColor: 'amber',
      a: 'Yes. On held-out validation data, R² = 1 - (SS_res / SS_tot). If the model overfits and its residual sum of squares exceeds the total variance of the actual data, R² becomes negative. A negative R² indicates the model performs worse than simply predicting the historical mean (ȳ) for every future point.',
    },
    {
      q: 'How does your multi-step recursive forecasting engine work step-by-step?',
      category: 'Inference Engine',
      badge: 'Autoregression',
      badgeColor: 'emerald',
      a: 'At future step t+1, ground truth is unavailable. The engine: 1) calculates future calendar attributes (day of week, month), 2) pulls previous historical observations into lag_1 and lag_7 features, 3) predicts ŷ_{t+1}, 4) RECURSIVELY appends ŷ_{t+1} back into the buffer, 5) uses ŷ_{t+1} as the lag_1 input for step t+2, continuing iteratively up to the full forecast horizon H.',
    },
    {
      q: 'How do you compute prediction intervals for deterministic Scikit-learn models?',
      category: 'Uncertainty Estimation',
      badge: 'Confidence Bounds',
      badgeColor: 'sky',
      a: 'Because Scikit-learn regressors do not output Bayesian distributions natively, we apply parametric empirical error propagation based on the validation RMSE. As the forecast horizon extends into the future, forecast entropy compounds: σ(h) = RMSE * sqrt(1 + 0.10 * (h - 1)). Bounds are computed as ŷ ± z * σ(h), where z=1.96 for 95% confidence and z=1.28 for 80% confidence.',
    },
  ];

  const formulas = [
    {
      name: 'Mean Absolute Error (MAE)',
      math: 'MAE = (1 / n) * Σ |y_i - ŷ_i|',
      units: 'Target Units (e.g. Sales Count / Currency)',
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
      units: 'Target Units (e.g. Sales Count / Currency)',
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
      units: 'Target Units (with α = 0.10)',
      desc: 'Compounds forecast uncertainty proportionally to future horizon step h, causing confidence intervals to expand over time.',
    },
  ];

  const demoSteps = [
    { step: 1, title: 'Dashboard Overview', desc: 'Point out active backend health (200 OK), system telemetry, and Milestone 8 completion.' },
    { step: 2, title: 'Datasets Ingestion', desc: 'Click "Load Sample Sales Dataset" (120 daily records) and explain detected column profiles.' },
    { step: 3, title: 'Preprocessing & Feature Engineering', desc: 'Execute pipeline; demonstrate chronological sorting, calendar features, and lag_1/lag_7 creation in the audit log.' },
    { step: 4, title: 'Exploratory Time-Series Analytics', desc: 'Show interactive curve, toggle 7-day vs 14-day moving averages, and review least-squares linear trendline.' },
    { step: 5, title: 'Chronological Model Training', desc: 'Train Linear Regression baseline and Random Forest Regressor; explain 80/20 chronological split with shuffle=False.' },
    { step: 6, title: 'Out-of-Sample Evaluation Leaderboard', desc: 'Review the comparison table; explain why Random Forest is recommended based on lowest validation RMSE.' },
    { step: 7, title: 'Recursive Future Forecasting', desc: 'Generate 14-day future predictions; show continuous transition from history to future with expanding 95% confidence bands and export CSV.' },
    { step: 8, title: 'Viva & Architecture Hub', desc: 'Demonstrate this built-in Viva Defense Hub and answer any theoretical question posed by the examiner!' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1.5 uppercase tracking-wider">
            <span>Milestone 8</span>
            <span>•</span>
            <span>BTech 5th-Semester Defense & Documentation</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-400" />
            Viva Defense & Architecture Hub
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Complete theoretical justifications, mathematical formulas, examiner questions, and demonstration scripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>v1.0.0 Production Ready</span>
          </span>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content: Examiner Q&A */}
      {activeSubTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>High-frequency university viva examination questions with model answers.</span>
            <span className="font-mono text-indigo-400">Click card to expand</span>
          </div>

          <div className="space-y-3">
            {questions.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                  className={`cursor-pointer rounded-2xl border transition-all p-5 ${
                    isExpanded
                      ? 'bg-slate-900/90 border-indigo-500/40 shadow-xl'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        Q{idx + 1}: {item.q}
                      </h3>
                    </div>
                    <div className="p-1 rounded-lg bg-slate-800 text-slate-400 mt-1">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                        Model Answer for Examiner:
                      </div>
                      <p className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-sans text-slate-200">
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
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{f.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {f.units}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-indigo-300 text-center font-bold">
                {f.math}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Content: System Architecture */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">FastAPI ASGI Backend</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-performance Python backend with automatic Pydantic data validation, OpenAPI docs at <code className="text-indigo-300">/docs</code>, and asynchronous endpoint routing.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Scikit-learn ML Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chronological model training, Scikit-learn metrics computation, Joblib binary serialization, and recursive lag feature feedback.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">React 18 + Vite Frontend</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Single-page application styled with Tailwind CSS, Recharts for composed time-series charts, and an application-level Error Boundary.
              </p>
            </div>
          </div>

          {/* ASCII Architecture Preview */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase">Architecture Pipeline</div>
            <pre className="text-[11px] font-mono text-indigo-300/90 overflow-x-auto leading-relaxed">
{`Raw CSV Ingestion ──▶ Validation & Chronological Sort ──▶ Imputation (ffill)
                                                                 │
      ┌──────────────────────────────────────────────────────────┘
      ▼
Lag Features (t-1, t-7) + Calendar Sine/Cosine
      │
      ▼
Chronological Train (80%) / Validation (20%) Split [shuffle=False]
      │
      ├───────────────────────────────┐
      ▼                               ▼
Linear Regression Baseline      Random Forest Regressor (Ensemble)
      │                               │
      └───────────────┬───────────────┘
                      ▼
Evaluation: MAE, MSE, RMSE, R² Leaderboard (Pick Best RMSE)
                      │
                      ▼
Recursive Multi-Step Forecasting (14 Days) + Compounding Prediction Intervals`}
            </pre>
          </div>
        </div>
      )}

      {/* Content: 5-Minute Live Demo Script */}
      {activeSubTab === 'demo' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
            <span>Follow this exact sequence during your college project viva demonstration.</span>
            <span className="font-mono font-bold">Estimated Time: 5 Minutes</span>
          </div>

          <div className="space-y-3">
            {demoSteps.map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3.5 hover:bg-slate-900/60 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{s.title}</h4>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
