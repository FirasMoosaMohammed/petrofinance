import { MapPin, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { KPICard } from '@/components/kpi/kpi-card';
import { ProductionTrendChart } from '@/components/charts/production-trend-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatSAR, formatBarrels, formatNumber } from '@/lib/formatters';
import type { ProductionReportResponse } from '@/types/api';

interface ProductionPageProps {
  production: ProductionReportResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedBuName: string;
  onSelectBu?: (buId: string) => void;
  onNavigateToReports?: () => void;
}

export function ProductionPage({
  production,
  isLoading,
  error,
  onRetry,
  selectedBuName,
  onSelectBu,
  onNavigateToReports,
}: ProductionPageProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs my-8">
        <AlertCircle className="h-10 w-10 text-zinc-400 mb-2" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Failed to load Production data</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1 mb-4">{error}</p>
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  if (isLoading || !production) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const { summary, by_field, monthly_production } = production;
  const hasProduction = by_field && by_field.length > 0 && summary.total_barrels > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Contextual notice if non-extraction business unit */}
      {!hasProduction && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 text-xs">
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedBuName}</strong> is a non-extraction division. Reservoir extraction volumes and lifting costs are tracked under Upstream Operations.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={() => onSelectBu?.('BU-UPSTREAM')}
              className="h-7 text-xs px-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-medium"
            >
              Switch to Upstream
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectBu?.('all')}
              className="h-7 text-xs px-2.5 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
            >
              All Fields
            </Button>
            {onNavigateToReports && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onNavigateToReports}
                className="h-7 text-xs px-2.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                View Financials
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Gross Barrels"
          value={hasProduction ? formatBarrels(summary.total_barrels, true) : '—'}
          trendText={hasProduction ? 'Active reservoir extraction' : 'Non-extraction division'}
          subtitle={hasProduction ? `${formatNumber(summary.total_barrels)} bbl gross` : 'No active wellheads'}
          isFavorable={hasProduction ? undefined : null}
        />
        <KPICard
          title="Avg Realized Price"
          value={hasProduction ? formatSAR(summary.avg_realized_price) : '—'}
          trendText={hasProduction ? 'Market benchmark' : 'No market sales'}
          subtitle={hasProduction ? 'Netback realized sales' : 'Tariffs in Financials'}
          isFavorable={hasProduction ? undefined : null}
        />
        <KPICard
          title="Gross Sales Est."
          value={hasProduction ? formatSAR(summary.estimated_gross_sales, true) : '—'}
          trendText={hasProduction ? 'Volume × Netback Price' : 'Transport revenue'}
          subtitle={hasProduction ? 'Estimated gross proceeds' : 'See Financial Ledger'}
          isFavorable={hasProduction ? undefined : null}
        />
        <KPICard
          title="Lifting Cost / Barrel"
          value={hasProduction ? `SAR ${summary.cost_per_barrel}` : '—'}
          trendText={hasProduction ? 'Operational lifting efficiency' : 'Not applicable'}
          subtitle={hasProduction ? `OPEX: ${formatSAR(summary.total_upstream_opex, true)}` : 'OPEX recorded in Ledger'}
          isFavorable={hasProduction ? undefined : null}
        />
      </div>

      {/* Production Chart */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white dark:bg-zinc-950">
        <CardHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Extraction Volume &amp; Realized Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          {hasProduction ? (
            <ProductionTrendChart data={monthly_production} height={280} />
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/40 dark:bg-zinc-900/20">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                No extraction trend data for {selectedBuName}
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-sm mt-1">
                Monthly extraction volumes and netback price curves originate from producing upstream wellheads.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Field Breakdown Cards */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          Producing Reservoirs &amp; Field Concessions
        </h3>
        {hasProduction ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {by_field.map((field) => (
              <Card key={field.field_id} className="border border-zinc-200 dark:border-zinc-800 shadow-2xs bg-white dark:bg-zinc-950">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{field.field_name}</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-zinc-400" />
                        {field.region}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium">
                      {field.field_type}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-zinc-400 block">Total Barrels</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatBarrels(field.total_barrels, true)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 block">Avg Price</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatSAR(field.avg_realized_price)}/bbl
                      </span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-[11px] text-zinc-400 block">Estimated Sales</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {formatSAR(field.estimated_gross_sales, true)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              0 field concessions assigned to {selectedBuName}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              Active reservoir concessions (Ghawar Alpha, Safan Horizon, Shaybah Dunes, etc.) belong to Upstream Operations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
