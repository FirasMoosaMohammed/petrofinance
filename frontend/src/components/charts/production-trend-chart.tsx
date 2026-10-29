import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { MonthlyProductionItem } from '@/types/api';
import { formatNumber, formatSAR } from '@/lib/formatters';

interface ProductionTrendChartProps {
  data: MonthlyProductionItem[];
  height?: number;
}

export function ProductionTrendChart({ data, height = 300 }: ProductionTrendChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    volumeM: item.barrels_produced / 1_000_000,
    price: item.avg_price,
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="month_label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val.toFixed(1)}M bbl`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[200, 360]}
            tick={{ fontSize: 11, fill: '#d97706' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `SAR ${val}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
                    <p className="font-semibold text-slate-800 mb-1">{label}</p>
                    <div className="space-y-1">
                      {payload.map((entry: any, index: number) => (
                        <div key={`p-${index}`} className="flex items-center justify-between gap-4">
                          <span className="text-slate-600">{entry.name}:</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            {entry.dataKey === 'volumeM'
                              ? `${formatNumber(entry.payload.barrels_produced)} bbl`
                              : formatSAR(entry.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />
          <Bar
            yAxisId="left"
            dataKey="volumeM"
            name="Gross Production (M bbl)"
            fill="#0f172a"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="price"
            name="Realized Price (SAR/bbl)"
            stroke="#d97706"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#d97706' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

