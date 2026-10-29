import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { UnfavorableCategoryItem } from '@/types/api';
import { formatSAR } from '@/lib/formatters';

interface VarianceBarChartProps {
  data: UnfavorableCategoryItem[];
  height?: number;
}

export function VarianceBarChart({ data, height = 300 }: VarianceBarChartProps) {
  const chartData = data.slice(0, 6).map((item) => ({
    ...item,
    varianceM: item.variance_amount / 1_000_000,
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
            tickFormatter={(val) => `+SAR ${val}M`}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={140}
            tick={{ fontSize: 10, fill: '#334155' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => (val.length > 20 ? `${val.substring(0, 18)}...` : val)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as UnfavorableCategoryItem;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
                    <p className="font-semibold text-slate-900 mb-0.5">{item.category}</p>
                    <p className="text-[11px] text-slate-500 mb-2">{item.business_unit_name}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Overspend Variance:</span>
                        <span className="font-semibold text-rose-600 font-mono">
                          +{formatSAR(item.variance_amount, true)} ({item.variance_pct > 0 ? `+${item.variance_pct}%` : `${item.variance_pct}%`})
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Actual OPEX:</span>
                        <span className="font-mono text-slate-700">{formatSAR(item.actual_amount, true)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Budget Target:</span>
                        <span className="font-mono text-slate-700">{formatSAR(item.budget_amount, true)}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="varianceM" name="Overspend (SAR Millions)" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill="#f43f5e" fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

