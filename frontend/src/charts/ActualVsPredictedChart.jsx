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
} from 'recharts';
import { Eye, EyeOff, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const actualEntry = payload.find((p) => p.dataKey === 'actual');
    const predEntry = payload.find((p) => p.dataKey === 'predicted');
    const residual =
      actualEntry && predEntry ? Number((actualEntry.value - predEntry.value).toFixed(2)) : null;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs space-y-1.5 font-sans">
        <div className="text-slate-500 font-medium border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
          <span>Date: <span className="font-mono text-slate-800">{label}</span></span>
          {residual !== null && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                Math.abs(residual) < 5
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              Diff: {residual > 0 ? `+${residual}` : residual}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600">{entry.name}:</span>
              </span>
              <span className="font-mono font-semibold text-slate-900">
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
      <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <Activity className="w-5 h-5 mb-2 text-slate-400" />
        No test set prediction data available.
      </div>
    );
  }

  const values = predictions.flatMap((p) => [p.actual, p.predicted]).filter((v) => !isNaN(v));
  const minY = Math.floor(Math.min(...values) * 0.95);
  const maxY = Math.ceil(Math.max(...values) * 1.05);

  return (
    <div className="space-y-3">
      {/* Visibility Controls & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-600 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 inline-block" />
            <span>Solid Blue: Actual Values</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 border-b border-dashed border-emerald-600 inline-block" />
            <span>Dashed Green: Predicted Values</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowActual(!showActual)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
              showActual
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            {showActual ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Actual</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPredicted(!showPredicted)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
              showPredicted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            {showPredicted ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Predicted</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full bg-white rounded-lg border border-slate-200 p-3 pt-5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={predictions} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />

            {/* Actual Curve */}
            {showActual && (
              <Line
                type="monotone"
                dataKey="actual"
                name={`Actual (${targetName})`}
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#2563eb' }}
                activeDot={{ r: 5 }}
              />
            )}

            {/* Predicted Curve */}
            {showPredicted && (
              <Line
                type="monotone"
                dataKey="predicted"
                name={`Predicted (${modelName})`}
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#059669' }}
                activeDot={{ r: 5 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
