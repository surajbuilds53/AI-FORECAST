import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Eye, EyeOff, Calendar, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload;
    const isForecast = item?.is_forecast;

    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 font-mono">
        <div className="text-slate-400 font-sans font-semibold border-b border-slate-800/80 pb-1.5 flex items-center justify-between gap-4">
          <span>Date: {label}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isForecast
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isForecast ? `Forecast Step +${item?.step || ''}` : 'Historical Observation'}
          </span>
        </div>

        <div className="space-y-1">
          {item?.historical !== null && item?.historical !== undefined && (
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-300 font-sans">Historical Actual:</span>
              </span>
              <span className="text-white font-bold">{Number(item.historical).toLocaleString()}</span>
            </div>
          )}

          {item?.forecast !== null && item?.forecast !== undefined && (
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-slate-300 font-sans">Predicted Forecast:</span>
              </span>
              <span className="text-purple-300 font-bold">{Number(item.forecast).toLocaleString()}</span>
            </div>
          )}

          {isForecast && item?.lower !== null && item?.upper !== null && (
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400 font-sans">Prediction Interval:</span>
              <span className="text-emerald-400 font-bold">
                [{item.lower.toFixed(1)} — {item.upper.toFixed(1)}]
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function ForecastChart({
  historicalPoints = [],
  forecastPoints = [],
  targetName = 'Target',
  modelName = 'Model',
  confidenceLevel = 0.95,
}) {
  const [showCI, setShowCI] = useState(true);
  const [showHistorical, setShowHistorical] = useState(true);
  const [showForecast, setShowForecast] = useState(true);

  if (!historicalPoints.length && !forecastPoints.length) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
        No forecast data available to render chart.
      </div>
    );
  }

  // Seamlessly stitch historical and forecast points
  const chartData = [];

  // Add historical points
  historicalPoints.forEach((hp, idx) => {
    const isLastHist = idx === historicalPoints.length - 1;
    chartData.push({
      date: hp.date,
      historical: hp.actual,
      forecast: isLastHist ? hp.actual : null, // Bridge historical and forecast lines
      lower: isLastHist ? hp.actual : null,
      upper: isLastHist ? hp.actual : null,
      is_forecast: false,
      step: 0,
    });
  });

  // Add forecast points
  forecastPoints.forEach((fp) => {
    chartData.push({
      date: fp.date,
      historical: null,
      forecast: fp.predicted,
      lower: fp.lower_bound,
      upper: fp.upper_bound,
      is_forecast: true,
      step: fp.step,
    });
  });

  // Boundary split date for reference line
  const splitDate = historicalPoints.length > 0 ? historicalPoints[historicalPoints.length - 1].date : null;

  // Dynamic Y-axis limits
  const allValues = [
    ...historicalPoints.map((p) => p.actual),
    ...forecastPoints.map((p) => p.predicted),
    ...forecastPoints.map((p) => p.upper_bound),
  ].filter((v) => !isNaN(v) && v !== null);

  const minY = Math.floor(Math.min(...allValues) * 0.92);
  const maxY = Math.ceil(Math.max(...allValues) * 1.08);

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Forecast Horizon:</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono text-[11px] border border-purple-500/20">
            +{forecastPoints.length} Steps Out-of-Sample
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px] border border-emerald-500/20">
            {Math.round(confidenceLevel * 100)}% Confidence Band
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showHistorical
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {showHistorical ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            History ({historicalPoints.length})
          </button>
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showForecast
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {showForecast ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Forecast ({forecastPoints.length}d)
          </button>
          <button
            onClick={() => setShowCI(!showCI)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showCI
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {showCI ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Confidence Interval
          </button>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-88 w-full bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 pt-6">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 25, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
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

            {/* Split marker */}
            {splitDate && (
              <ReferenceLine
                x={splitDate}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: 'Forecast Origin',
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'top',
                }}
              />
            )}

            {/* Upper Confidence Band Area */}
            {showCI && (
              <Area
                type="monotone"
                dataKey="upper"
                name={`Upper ${Math.round(confidenceLevel * 100)}% CI`}
                stroke="#a855f7"
                strokeWidth={1}
                strokeDasharray="2 2"
                fill="url(#ciGradient)"
                dot={false}
              />
            )}

            {/* Lower Confidence Bound Line */}
            {showCI && (
              <Line
                type="monotone"
                dataKey="lower"
                name={`Lower ${Math.round(confidenceLevel * 100)}% CI`}
                stroke="#a855f7"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
              />
            )}

            {/* Historical Observations Line */}
            {showHistorical && (
              <Line
                type="monotone"
                dataKey="historical"
                name={`Historical ${targetName}`}
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#3b82f6', strokeWidth: 1, stroke: '#1e293b' }}
                activeDot={{ r: 5, stroke: '#60a5fa', strokeWidth: 2 }}
                connectNulls={false}
              />
            )}

            {/* Out-of-sample Forecast Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                name={`Recursive Forecast (${modelName})`}
                stroke="#a855f7"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 3.5, fill: '#a855f7', strokeWidth: 1, stroke: '#4c1d95' }}
                activeDot={{ r: 6, stroke: '#c084fc', strokeWidth: 2 }}
                connectNulls={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-blue-500 inline-block" /> Solid Blue = Past Historical Observations
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-purple-500 border-b border-dashed border-purple-500 inline-block" /> Dashed Purple = Multi-Step Recursive Forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 bg-purple-500/20 border border-purple-500/40 rounded inline-block" /> Shaded Band = {Math.round(confidenceLevel * 100)}% Empirical Interval
        </span>
      </div>
    </div>
  );
}
