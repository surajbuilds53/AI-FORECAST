import React from 'react';
import StatusCard from '../components/StatusCard';
import { 
  Database, 
  Cpu, 
  LineChart, 
  Server, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Code2,
  Activity,
  FileCheck,
  BrainCircuit
} from 'lucide-react';

export default function Dashboard({ 
  backendStatus, 
  currentDataset, 
  trainedModels = [], 
  onNavigateToDatasets,
  onNavigateToModels
}) {
  const latestModel = trainedModels[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Milestone 7 Complete: Future Forecasting & Inference Engine Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            AI Forecast — Intelligent AI/ML Forecasting Platform
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Full-stack machine learning forecasting suite for BTech 5th-semester viva and demonstration. Real out-of-sample recursive predictions (7, 14, 30 days), empirical prediction intervals, and CSV export.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Core Telemetry Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Core Module Telemetry
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            4 Systems Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Dataset Status (Dynamic) */}
          <StatusCard
            title="Dataset Status"
            value={currentDataset ? `${currentDataset.row_count} Rows` : "No Datasets"}
            subtitle={currentDataset ? `${currentDataset.filename} (${currentDataset.column_count} cols)` : "Storage configured in /datasets"}
            badgeText={currentDataset ? "Dataset Ready" : "Waiting for Upload"}
            badgeType={currentDataset ? "success" : "warning"}
            icon={currentDataset ? FileCheck : Database}
            accentColor={currentDataset ? "emerald" : "indigo"}
          />

          {/* Card 2: Model Status (Dynamic) */}
          <StatusCard
            title="Model Status"
            value={trainedModels.length > 0 ? `${trainedModels.length} Model${trainedModels.length > 1 ? 's' : ''} Trained` : "Engine Idle"}
            subtitle={latestModel ? `${latestModel.model_name} (${latestModel.training_time_ms}ms)` : "Scikit-learn pipeline ready"}
            badgeText={trainedModels.length > 0 ? "Models Ready" : "Uninitialized"}
            badgeType={trainedModels.length > 0 ? "success" : "default"}
            icon={trainedModels.length > 0 ? BrainCircuit : Cpu}
            accentColor={trainedModels.length > 0 ? "emerald" : "sky"}
          />

          {/* Card 3: Forecast Status */}
          <StatusCard
            title="Forecast Status"
            value="Engine Active"
            subtitle="Recursive 7, 14, 30-day projection"
            badgeText="Operational"
            badgeType="success"
            icon={LineChart}
            accentColor="purple"
          />

          {/* Card 4: System Status */}
          <StatusCard
            title="System Status"
            value={backendStatus.healthy ? "Operational" : "Connecting"}
            subtitle={backendStatus.healthy ? "FastAPI Backend v0.7.0" : "Verifying API health"}
            badgeText={backendStatus.healthy ? "API Online" : "Checking"}
            badgeType={backendStatus.healthy ? "success" : "warning"}
            icon={Activity}
            accentColor={backendStatus.healthy ? "emerald" : "amber"}
          />
        </div>
      </div>

      {/* Quick Action Banner */}
      {!currentDataset ? (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">No Dataset Loaded</p>
              <p className="text-xs text-slate-400">Upload a CSV dataset or load the 120-day daily sales sample to start training ML models.</p>
            </div>
          </div>
          <button
            onClick={onNavigateToDatasets}
            className="shrink-0 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
          >
            <span>Open Datasets Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : trainedModels.length === 0 ? (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Dataset Ready — Train Your First Model</p>
              <p className="text-xs text-slate-400">Train a Linear Regression baseline or Random Forest Regressor on chronological splits.</p>
            </div>
          </div>
          <button
            onClick={onNavigateToModels}
            className="shrink-0 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
          >
            <span>Go to Models Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/* Architecture & Roadmap Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full-Stack Communication Overview */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Full-Stack Interconnect</h3>
              <p className="text-xs text-slate-400">React frontend to FastAPI communication status</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${backendStatus.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-xs font-medium text-slate-200">GET /health Endpoint</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {backendStatus.healthy ? '200 OK (Healthy)' : 'Connecting...'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-slate-200">POST /api/models/train (Scikit-learn)</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">Operational</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-medium text-slate-200">API Documentation</span>
              </div>
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1"
              >
                /docs <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Roadmap & Next Steps */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Project Roadmap</h3>
              <p className="text-xs text-slate-400">BTech 5th-Semester milestone progression</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 opacity-80">
              <span className="font-mono font-bold text-emerald-400 mt-0.5">M1-M4</span>
              <div>
                <p className="font-medium text-white">Foundation, Data Upload, Preprocessing & Visualization</p>
                <p className="text-slate-400 text-[11px]">FastAPI, React Vite, Recharts time-series and feature engineering complete.</p>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">Done</span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 opacity-80">
              <span className="font-mono font-bold text-emerald-400 mt-0.5">M5</span>
              <div>
                <p className="font-medium text-white">Model Training Pipeline</p>
                <p className="text-slate-400 text-[11px]">Linear Regression baseline and Random Forest Regressor on chronological splits.</p>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">Done</span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 opacity-80">
              <span className="font-mono font-bold text-emerald-400 mt-0.5">M6</span>
              <div>
                <p className="font-medium text-white">Model Evaluation & Benchmarking</p>
                <p className="text-slate-400 text-[11px]">MAE, MSE, RMSE, R² comparison table and Actual vs Predicted curves.</p>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">Done</span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <span className="font-mono font-bold text-purple-400 mt-0.5">M7</span>
              <div>
                <p className="font-medium text-white">Future Forecasting Engine</p>
                <p className="text-slate-400 text-[11px]">Iterative recursive multi-step forecasting with prediction intervals & CSV export.</p>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold uppercase">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
