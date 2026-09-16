import React from 'react';
import { Menu, RefreshCw } from 'lucide-react';

export default function Header({
  backendStatus = { healthy: false },
  checkBackendHealth,
  isChecking,
  onOpenMobileMenu
}) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-slate-700 md:hidden">
          AI Forecast
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {backendStatus.healthy ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            API Connected
          </span>
        ) : isChecking ? (
          <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Checking API...
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            API Offline
          </span>
        )}

        <button
          onClick={checkBackendHealth}
          disabled={isChecking}
          title="Refresh backend status"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
}
