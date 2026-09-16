import { 
  BarChart3, 
  Database, 
  Sliders,
  LineChart as ChartIcon,
  Cpu, 
  TrendingUp, 
  Settings, 
  Activity, 
  Sparkles,
  Scale
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, badge: null },
    { id: 'datasets', name: 'Datasets', icon: Database, badge: 'Ready' },
    { id: 'preprocessing', name: 'Preprocessing', icon: Sliders, badge: 'Ready' },
    { id: 'analytics', name: 'Analytics', icon: ChartIcon, badge: 'Ready' },
    { id: 'models', name: 'Models', icon: Cpu, badge: 'Ready' },
    { id: 'evaluation', name: 'Evaluation', icon: Scale, badge: 'Ready' },
    { id: 'forecasts', name: 'Forecasts', icon: TrendingUp, badge: 'Milestone 7' },
    { id: 'settings', name: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            AI Forecast
          </h1>
          <p className="text-[11px] text-indigo-400 font-medium tracking-wide uppercase">
            Intelligence Suite
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Platform Overview
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal border ${
                  item.badge === 'Ready' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700/50'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status / Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Milestone 6 Active</span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          v0.6.0 • Model Evaluation
        </div>
      </div>
    </aside>
  );
}
