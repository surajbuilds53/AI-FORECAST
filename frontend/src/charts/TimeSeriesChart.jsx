import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs space-y-1 font-mono">
        <div className="text-slate-500 font-sans font-medium border-b border-slate-100 pb-1">
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 font-sans">{entry.name}:</span>
            </span>
            <span className="text-slate-900 font-bold">
              {entry.value !== null && entry.value !== undefined ? Number(entry.value).toLocaleString() : '—'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TimeSeriesChart({ data = [], targetName = 'Target', dateName = 'Date', windowSize = 7 }) {
  const [showRolling, setShowRolling] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 text-xs font-mono">
        No time-series data available to plot.
      </div>
    );
  }

  // Calculate dynamic min and max for Y-Axis padding
  const values = data.map((d) => d.actual).filter((v) => typeof v === 'number' && !isNaN(v));
  const minY = values.length > 0 ? Math.floor(Math.min(...values) * 0.95) : 0;
  const maxY = values.length > 0 ? Math.ceil(Math.max(...values) * 1.05) : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">
          {data.length} observations
        </span>
        <button
          onClick={() => setShowRolling(!showRolling)}
          className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
            showRolling
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-white text-slate-400 border-slate-200 line-through'
          }`}
        >
          {windowSize}-Day Moving Average
        </button>
      </div>

      <div className="h-80 w-full bg-white rounded-lg border border-slate-200 p-3 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(val) => {
                if (typeof val === 'string' && val.includes('-')) {
                  const parts = val.split('-');
                  return `${parts[1]}/${parts[2] || parts[1]}`;
                }
                return val;
              }}
            />
            <YAxis
              domain={[minY, maxY]}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />

            {/* Actual Series */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 2, fill: '#2563eb', strokeWidth: 0 }}
              activeDot={{ r: 4, stroke: '#2563eb', strokeWidth: 2 }}
            />

            {/* Moving Average */}
            {showRolling && (
              <Line
                type="monotone"
                dataKey="rolling_mean"
                name="Moving Average"
                stroke="#d97706"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, stroke: '#d97706', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
