import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Eye, EyeOff } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 font-mono">
        <div className="text-slate-400 font-sans font-semibold border-b border-slate-800/80 pb-1">
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300 font-sans">{entry.name}:</span>
            </span>
            <span className="text-white font-bold">
              {entry.value !== null && entry.value !== undefined ? Number(entry.value).toLocaleString() : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TimeSeriesChart({ data, targetName, dateName, windowSize }) {
  const [showRolling, setShowRolling] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-500 text-xs font-mono">
        No time-series data available to plot.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Visibility Controls */}
      <div className="flex items-center justify-end gap-3 text-xs">
        <button
          onClick={() => setShowRolling(!showRolling)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
            showRolling
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
          }`}
        >
          {showRolling ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>{windowSize}-Day Rolling Mean</span>
        </button>

        <button
          onClick={() => setShowTrend(!showTrend)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
            showTrend
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
          }`}
        >
          {showTrend ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>Linear Trendline</span>
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              dy={10}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => Number(val).toLocaleString()}
              domain={['auto', 'auto']}
              dx={-5}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Historical Actual Values */}
            <Area
              type="monotone"
              dataKey="actual"
              name={`Actual ${targetName}`}
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorActual)"
              dot={false}
              activeDot={{ r: 5, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }}
            />

            {/* Rolling Moving Average */}
            {showRolling && (
              <Line
                type="monotone"
                dataKey="rolling_mean"
                name={`${windowSize}-Day Moving Avg`}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            )}

            {/* Fitted Linear Trendline */}
            {showTrend && (
              <Line
                type="linear"
                dataKey="trend"
                name="Fitted Trendline"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
