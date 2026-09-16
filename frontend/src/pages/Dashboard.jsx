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
  Activity
} from 'lucide-react';
import { MILESTONES } from '../utils/constants';

export default function Dashboard({ backendStatus }) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Milestone 1 Complete: System Foundation Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            AI Forecast — Intelligent AI/ML Forecasting Platform
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Full-stack machine learning forecasting suite for BTech 5th-semester viva and demonstration. Modular Python FastAPI backend cleanly linked with React Vite frontend.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Core Telemetry Cards: Dataset Status, Model Status, Forecast Status, System Status */}
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
          {/* Card 1: Dataset Status */}
          <StatusCard
            title="Dataset Status"
            value="No Datasets"
            subtitle="Storage configured in /datasets"
            badgeText="Waiting for Upload"
            badgeType="warning"
            icon={Database}
            accentColor="indigo"
          />

          {/* Card 2: Model Status */}
          <StatusCard
            title="Model Status"
            value="Engine Idle"
            subtitle="ML pipelines ready for training"
            badgeText="Uninitialized"
            badgeType="default"
            icon={Cpu}
            accentColor="sky"
          />

          {/* Card 3: Forecast Status */}
          <StatusCard
            title="Forecast Status"
            value="No Run"
            subtitle="Predictive engine standing by"
            badgeText="Standby"
            badgeType="info"
            icon={LineChart}
            accentColor="emerald"
          />

          {/* Card 4: System Status */}
          <StatusCard
            title="System Status"
            value={backendStatus.healthy ? "Operational" : "Connecting"}
            subtitle={backendStatus.healthy ? "FastAPI Backend v0.1.0" : "Verifying API health"}
            badgeText={backendStatus.healthy ? "API Online" : "Checking"}
            badgeType={backendStatus.healthy ? "success" : "warning"}
            icon={Activity}
            accentColor={backendStatus.healthy ? "emerald" : "amber"}
          />
        </div>
      </div>

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
                <span className="text-xs font-medium text-slate-200">Cross-Origin Resource Sharing (CORS)</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">Configured</span>
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
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <span className="font-mono font-bold text-indigo-400 mt-0.5">M1</span>
              <div>
                <p className="font-medium text-white">Project Foundation</p>
                <p className="text-slate-400 text-[11px]">FastAPI backend, React frontend, Tailwind CSS, /health check, 4 core telemetry status cards.</p>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">Current</span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 opacity-80">
              <span className="font-mono font-bold text-slate-500 mt-0.5">M2</span>
              <div>
                <p className="font-medium text-slate-300">Dataset Upload</p>
                <p className="text-slate-500 text-[11px]">CSV upload, validation, row/col count, missing values, column profiling.</p>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Next Milestone</span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 opacity-80">
              <span className="font-mono font-bold text-slate-500 mt-0.5">M3</span>
              <div>
                <p className="font-medium text-slate-300">Data Preprocessing</p>
                <p className="text-slate-500 text-[11px]">Datetime parsing, sorting, missing value handling, lag/rolling features.</p>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Upcoming</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
