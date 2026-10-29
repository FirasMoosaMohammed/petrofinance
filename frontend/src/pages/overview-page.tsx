import { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { KPICard } from '@/components/kpi/kpi-card';
import { RevenueOpexChart } from '@/components/charts/revenue-opex-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatSAR } from '@/lib/formatters';
import type { DashboardSummary, DashboardTrends, FinancialRecord, ProductionReportResponse } from '@/types/api';

interface OverviewPageProps {
  summary: DashboardSummary | null;
  trends: DashboardTrends | null;
  records: FinancialRecord[];
  production?: ProductionReportResponse | null;
  isLoading: boolean;
  isFetching?: boolean;
  error: string | null;
  onRetry: () => void;
  selectedBuName: string;
  onNavigateToReports?: () => void;
}

export function OverviewPage({
  summary,
  trends,
  records,
  isLoading,
  isFetching = false,
  error,
  onRetry,
  onNavigateToReports
}: OverviewPageProps) {
  const [chartRange, setChartRange] = useState<'12m' | 'h1' | 'h2'>('12m');

  // Filter chart series instantly in client-side memory based on chart zoom!
  const displaySeries = useMemo(() => {
    if (!trends?.monthly_series) return [];
    if (chartRange === 'h1') {
      return trends.monthly_series.slice(0, 6);
    }
    if (chartRange === 'h2') {
      return trends.monthly_series.slice(6, 12);
    }
    return trends.monthly_series;
  }, [trends?.monthly_series, chartRange]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs my-8">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Failed to load data</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1 mb-6">{error}</p>
        <Button onClick={onRetry} size="sm" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Four Core Oil & Gas KPI Metric Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${isFetching ? 'opacity-70' : 'opacity-100'}`}>
        {/* Card 1: Actual Revenue */}
        <KPICard
          title="Actual Revenue"
          value={formatSAR(summary.actual_revenue, true)}
          variancePct={summary.revenue_variance_pct}
          trendText="vs Target"
          subtitle={`Budget: ${formatSAR(summary.budget_revenue, true)}`}
          isFavorable={summary.revenue_variance >= 0}
        />

        {/* Card 2: Operating OPEX */}
        <KPICard
          title="Operating OPEX"
          value={formatSAR(summary.actual_opex, true)}
          variancePct={summary.opex_variance_pct}
          trendText="vs Budget"
          subtitle={`Budget: ${formatSAR(summary.budget_opex, true)}`}
          isFavorable={summary.opex_variance <= 0}
        />

        {/* Card 3: Net Cash Margin */}
        <KPICard
          title="Net Cash Margin"
          value={formatSAR(summary.operating_profit, true)}
          variancePct={summary.operating_profit_margin_pct}
          trendText="Operating margin"
          subtitle="Revenue minus OPEX"
          isFavorable={summary.operating_profit >= 0}
        />

        {/* Card 4: Lifting Cost Rate */}
        <KPICard
          title="Lifting Cost Rate"
          value={summary.cost_per_barrel > 0 ? `SAR ${summary.cost_per_barrel}` : 'N/A'}
          trendText={summary.cost_per_barrel > 0 ? 'per gross barrel' : 'Corporate Unit'}
          subtitle={summary.production_barrels > 0 ? `${(summary.production_barrels / 1000000).toFixed(1)}M bbl extracted` : 'Non-extraction unit'}
          isFavorable={summary.cost_per_barrel > 0 && summary.cost_per_barrel <= 18}
        />
      </div>

      {/* 2. Revenue vs OPEX Trend Chart Section */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white dark:bg-zinc-950">
        <CardHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Revenue vs Operating Expenditure</CardTitle>
              {isFetching && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                  Querying...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setChartRange('12m')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  chartRange === '12m'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                12 Months
              </button>
              <button
                type="button"
                onClick={() => setChartRange('h1')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  chartRange === 'h1'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                H1 (Jan-Jun)
              </button>
              <button
                type="button"
                onClick={() => setChartRange('h2')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  chartRange === 'h2'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                H2 (Jul-Dec)
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-4">
          {trends && <RevenueOpexChart data={displaySeries} height={280} />}
        </CardContent>
      </Card>

      {/* 3. Key Budget Overruns (Executive Focus) */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white dark:bg-zinc-950">
        <CardHeader className="p-6 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Key Budget Overruns
            </CardTitle>
          </div>
          {onNavigateToReports && (
            <Button
              onClick={onNavigateToReports}
              variant="outline"
              size="sm"
              className="text-xs font-medium gap-1 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <span>Explore Full AG Grid ({records.length})</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {trends?.top_unfavorable_categories && trends.top_unfavorable_categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trends.top_unfavorable_categories.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/90 bg-zinc-50/60 dark:bg-zinc-900/50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                        {item.business_unit_name}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                        +{item.variance_pct}%
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.category}</h4>
                  </div>
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Overrun</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        +{formatSAR(item.variance_amount, true)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Actual</span>
                      <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        {formatSAR(item.actual_amount, true)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-zinc-500 dark:text-zinc-400">
              All categories are currently operating within authorized budget limits.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
