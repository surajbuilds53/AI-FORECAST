import React from 'react';

export default function StatusCard({
  title,
  value,
  subtitle,
  badgeText,
  badgeType = 'default',
  icon: Icon
}) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:border-slate-300 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded bg-slate-100 text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-0.5 mb-2">
        <div className="text-xl font-bold text-slate-900 font-mono">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {badgeText && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${getBadgeStyle()}`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
}
