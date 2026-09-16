import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
} from 'recharts';
import { Eye, EyeOff, Activity, AlertCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const actualEntry = payload.find((p) => p.dataKey === 'actual');
    const predEntry = payload.find((p) => p.dataKey === 'predicted');
    const residual =
      actualEntry && predEntry ? Number((actualEntry.value - predEntry.value).toFixed(2)) : null;

    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 font-mono">
        <div className="text-slate-400 font-sans font-semibold border-b border-slate-800/80 pb-1.5 flex items-center justify-between gap-4">
          <span>Date: {label}</span>
          {residual !== null && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                Math.abs(residual) < 5
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              Residual: {residual > 0 ? `+${residual}` : residual}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-300 font-sans">{entry.name}:</span>
              </span>
              <span className="text-white font-bold">
                {entry.value !== null && entry.value !== undefined
                  ? Number(entry.value).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function ActualVsPredictedChart({
  predictions = [],
  targetName = 'Target',
  modelName = 'Model',
}) {
  const [showActual, setShowActual] = useState(true);
  const [showPredicted, setShowPredicted] = useState(true);

  if (!predictions || predictions.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
        <Activity className="w-6 h-6 mb-2 text-slate-600 animate-pulse" />
        No validation prediction points available.
      </div>
    );
  }

  // Calculate min and max for Y-Axis padding
  const values = predictions.flatMap((p) => [p.actual, p.predicted]).filter((v) => !isNaN(v));
  const minY = Math.floor(Math.min(...values) * 0.95);
  const maxY = Math.ceil(Math.max(...values) * 1.05);

  return (
    <div className="space-y-4">
      {/* Chart Visibility Controls */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Evaluation Split:</span>
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[11px] border border-indigo-500/20">
            {predictions.length} Validation Holdout Rows
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showActual
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {showActual ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Actual ({targetName})
          </button>
          <button
            onClick={() => setShowPredicted(!showPredicted)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showPredicted
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {showPredicted ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Predicted ({modelName})
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={predictions} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
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
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />

            {/* Actual Curve */}
            {showActual && (
              <Area
                type="monotone"
                dataKey="actual"
                name={`Actual ${targetName}`}
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#actualGradient)"
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 1, stroke: '#1e293b' }}
                activeDot={{ r: 5, stroke: '#60a5fa', strokeWidth: 2 }}
              />
            )}

            {/* Predicted Curve */}
            {showPredicted && (
              <Line
                type="monotone"
                dataKey="predicted"
                name={`Predicted (${modelName})`}
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#064e3b' }}
                activeDot={{ r: 5, stroke: '#34d399', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 bg-blue-500 inline-block" /> Solid Blue = Actual Ground Truth
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 bg-emerald-500 border-b border-dashed border-emerald-500 inline-block" /> Dashed Emerald = Out-of-Sample Predictions
        </span>
      </div>
    </div>
  );
}
