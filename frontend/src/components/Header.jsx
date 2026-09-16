import React from 'react';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Bell, Terminal } from 'lucide-react';

export default function Header({ backendStatus, checkBackendHealth, isChecking }) {
  const getStatusBadge = () => {
    if (isChecking) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Checking API...</span>
        </div>
      );
    }

    if (backendStatus.healthy) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Backend Connected (8000)</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle className="w-3.5 h-3.5" />
        <span>Backend Disconnected</span>
      </div>
    );
  };

  return (
    <header className="h-16 bg-slate-900/70 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Predictive Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            System Foundation & Telemetry Center
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Backend status indicator */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            onClick={checkBackendHealth}
            disabled={isChecking}
            title="Refresh backend status"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors duration-150 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* Action icons */}
        <div className="flex items-center gap-2 text-slate-400">
          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>FastAPI + Vite</span>
          </div>
        </div>
      </div>
    </header>
  );
}
