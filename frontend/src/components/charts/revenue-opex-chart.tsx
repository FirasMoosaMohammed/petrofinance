import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { MonthlySeriesItem } from '@/types/api';
import { formatSAR } from '@/lib/formatters';

interface RevenueOpexChartProps {
  data: MonthlySeriesItem[];
  height?: number;
}

export function RevenueOpexChart({ data, height = 300 }: RevenueOpexChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    revActualM: item.actual_revenue / 1_000_000,
    revBudgetM: item.budget_revenue / 1_000_000,
    opexActualM: item.actual_opex / 1_000_000,
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="shadcnAreaPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#18181b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#18181b" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="shadcnAreaSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#71717a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#71717a" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
          <XAxis
            dataKey="month_label"
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide={true} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 shadow-md text-xs">
                    <p className="font-semibold text-zinc-900 mb-1.5">{label}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-zinc-600">
                          <span className="h-2 w-2 rounded-sm bg-zinc-900" />
                          Actual Revenue:
                        </span>
                        <span className="font-semibold text-zinc-950 font-mono">
                          {formatSAR(payload[0]?.payload.actual_revenue, true)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-zinc-600">
                          <span className="h-2 w-2 rounded-sm bg-zinc-400" />
                          Budget Target:
                        </span>
                        <span className="font-semibold text-zinc-700 font-mono">
                          {formatSAR(payload[0]?.payload.budget_revenue, true)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="natural"
            dataKey="revActualM"
            name="Actual Revenue"
            stroke="#18181b"
            strokeWidth={1.75}
            fillOpacity={1}
            fill="url(#shadcnAreaPrimary)"
          />
          <Area
            type="natural"
            dataKey="revBudgetM"
            name="Budget Revenue"
            stroke="#71717a"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#shadcnAreaSecondary)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
