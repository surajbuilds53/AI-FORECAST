import React from 'react';
import {
  LayoutDashboard,
  Database,
  SlidersHorizontal,
  LineChart,
  Cpu,
  Scale,
  TrendingUp,
  GraduationCap,
  X
} from 'lucide-react';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  backendStatus = { healthy: false },
  isChecking = false,
  isOpen = false,
  onClose = () => {}
}) {
  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasets', name: 'Datasets', icon: Database },
    { id: 'preprocessing', name: 'Preprocessing', icon: SlidersHorizontal },
    { id: 'analytics', name: 'Analytics', icon: LineChart },
    { id: 'models', name: 'Models', icon: Cpu },
    { id: 'evaluation', name: 'Evaluation', icon: Scale },
    { id: 'forecasts', name: 'Forecasts', icon: TrendingUp },
    { id: 'viva', name: 'Viva & Docs', icon: GraduationCap },
  ];

  const handleSelect = (id) => {
    setCurrentTab(id);
    onClose();
  };

  const renderStatus = () => {
    if (isChecking) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Checking...
        </span>
      );
    }
    if (backendStatus.healthy) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Connected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        Disconnected
      </span>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
        <div>
          <h1 className="font-semibold text-base text-slate-900 tracking-tight">
            AI Forecast
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Time-Series Forecasting
          </p>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom API Status (Real State) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
          API Status
        </div>
        <div>{renderStatus()}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-60 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-200 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
