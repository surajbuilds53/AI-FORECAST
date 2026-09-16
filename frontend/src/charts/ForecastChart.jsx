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
  ReferenceLine,
} from 'recharts';
import { Eye, EyeOff } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload;
    const isForecast = item?.is_forecast;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs space-y-1.5 font-sans">
        <div className="text-slate-500 font-medium border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
          <span>Date: <span className="font-mono text-slate-800">{label}</span></span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isForecast
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {isForecast ? `Forecast Step +${item?.step || ''}` : 'Historical Observation'}
          </span>
        </div>

        <div className="space-y-1">
          {item?.historical !== null && item?.historical !== undefined && (
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-slate-600">Historical:</span>
              </span>
              <span className="font-mono font-semibold text-slate-900">{Number(item.historical).toLocaleString()}</span>
            </div>
          )}

          {item?.forecast !== null && item?.forecast !== undefined && (
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="text-slate-600">Forecast:</span>
              </span>
              <span className="font-mono font-semibold text-emerald-700">{Number(item.forecast).toLocaleString()}</span>
            </div>
          )}

          {isForecast && item?.lower !== null && item?.upper !== null && (
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
              <span>CI [{Number(item.lower).toFixed(1)} — {Number(item.upper).toFixed(1)}]</span>
              <span className="text-slate-400">±{((Number(item.upper) - Number(item.lower)) / 2).toFixed(1)}</span>
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
      <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        No forecast data available to render chart.
      </div>
    );
  }

  // Build continuous timeline
  const chartData = [];

  // Show up to the last 45 historical points to keep it clean and focused
  const recentHistory = historicalPoints.slice(-45);

  recentHistory.forEach((hp, idx) => {
    const isLastHist = idx === recentHistory.length - 1;
    chartData.push({
      date: hp.date,
      historical: hp.actual,
      forecast: isLastHist ? hp.actual : null,
      lower: isLastHist ? hp.actual : null,
      upper: isLastHist ? hp.actual : null,
      is_forecast: false,
      step: 0,
    });
  });

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

  const splitDate = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].date : null;

  const allValues = [
    ...recentHistory.map((p) => p.actual),
    ...forecastPoints.map((p) => p.predicted),
    ...forecastPoints.map((p) => p.upper_bound),
    ...forecastPoints.map((p) => p.lower_bound),
  ].filter((v) => typeof v === 'number' && !isNaN(v));

  const minY = allValues.length > 0 ? Math.floor(Math.min(...allValues) * 0.95) : 0;
  const maxY = allValues.length > 0 ? Math.ceil(Math.max(...allValues) * 1.05) : 100;

  return (
    <div className="space-y-3">
      {/* Visibility Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 inline-block" />
            <span>Solid Blue: Historical Data</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
            <span>Green: Forecast</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-300 border-b border-dashed border-emerald-400 inline-block" />
            <span>Light Green: {Math.round(confidenceLevel * 100)}% Confidence Bounds</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowHistorical(!showHistorical)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
              showHistorical
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            {showHistorical ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>History</span>
          </button>
          <button
            type="button"
            onClick={() => setShowForecast(!showForecast)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
              showForecast
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            {showForecast ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Forecast</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCI(!showCI)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
              showCI
                ? 'bg-slate-100 text-slate-700 border-slate-300 font-medium'
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            {showCI ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Bounds</span>
          </button>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-80 w-full bg-white rounded-lg border border-slate-200 p-3 pt-5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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

            {splitDate && (
              <ReferenceLine
                x={splitDate}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
              />
            )}

            {/* Historical Observations Line */}
            {showHistorical && (
              <Line
                type="monotone"
                dataKey="historical"
                name={`Historical ${targetName}`}
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 2, fill: '#2563eb' }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            )}

            {/* Forecast Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                name={`Forecast (${modelName})`}
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#059669' }}
                activeDot={{ r: 5 }}
                connectNulls={true}
              />
            )}

            {/* Upper Confidence Bound */}
            {showCI && (
              <Line
                type="monotone"
                dataKey="upper"
                name={`Upper Bound (${Math.round(confidenceLevel * 100)}%)`}
                stroke="#86efac"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
                connectNulls={true}
              />
            )}

            {/* Lower Confidence Bound */}
            {showCI && (
              <Line
                type="monotone"
                dataKey="lower"
                name={`Lower Bound (${Math.round(confidenceLevel * 100)}%)`}
                stroke="#86efac"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
                connectNulls={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
