import React from 'react';

export default function StatusCard({
  title,
  value,
  subtitle,
  badgeText,
  badgeType = 'default',
  icon: Icon,
  accentColor = 'indigo'
}) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'info':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'indigo':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getAccentBorder = () => {
    switch (accentColor) {
      case 'emerald':
        return 'hover:border-emerald-500/40 group-hover:text-emerald-400';
      case 'sky':
        return 'hover:border-sky-500/40 group-hover:text-sky-400';
      case 'indigo':
        return 'hover:border-indigo-500/40 group-hover:text-indigo-400';
      default:
        return 'hover:border-slate-600';
    }
  };

  return (
    <div className={`group relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 ${getAccentBorder()}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-800/80 text-slate-400 group-hover:text-white transition-colors duration-200">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1 mb-4">
        <div className="text-2xl font-bold text-white tracking-tight">
          {value}
        </div>
        <p className="text-xs text-slate-400">
          {subtitle}
        </p>
      </div>

      {badgeText && (
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getBadgeStyle()}`}>
            {badgeText}
          </span>
          <span className="text-[11px] text-slate-500">
            Milestone 1
          </span>
        </div>
      )}
    </div>
  );
}
