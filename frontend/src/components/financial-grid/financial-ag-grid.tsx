import React, { useRef, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  type ColDef,
  type GridReadyEvent,
  type ICellRendererParams,
  themeQuartz
} from 'ag-grid-community';
import { Download, Search, AlertCircle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import type { FinancialRecord } from '@/types/api';
import { formatSAR, formatPercent } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme extending Quartz for enterprise styling
const enterpriseGridTheme = themeQuartz.withParams({
  accentColor: '#0f172a',
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderRadius: 6,
  browserColorScheme: 'light',
  chromeBackgroundColor: '#f8fafc',
  fontSize: 13,
  fontFamily: 'inherit',
  headerBackgroundColor: '#f8fafc',
  headerFontWeight: 600,
  headerTextColor: '#334155',
  rowHoverColor: '#f1f5f9',
  selectedRowBackgroundColor: '#e2e8f0',
});

const enterpriseGridDarkTheme = themeQuartz.withParams({
  accentColor: '#38bdf8',
  backgroundColor: '#09090b',
  borderColor: '#27272a',
  borderRadius: 6,
  browserColorScheme: 'dark',
  chromeBackgroundColor: '#18181b',
  fontSize: 13,
  fontFamily: 'inherit',
  headerBackgroundColor: '#18181b',
  headerFontWeight: 600,
  headerTextColor: '#f4f4f5',
  rowHoverColor: '#18181b',
  selectedRowBackgroundColor: '#27272a',
  foregroundColor: '#f4f4f5',
});

interface FinancialAgGridProps {
  rowData: FinancialRecord[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  totalCount?: number;
  summary?: {
    total_budget: number;
    total_actual: number;
    total_variance: number;
  };
}

export function FinancialAgGrid({
  rowData,
  isLoading = false,
  error = null,
  onRetry,
  totalCount,
  summary
}: FinancialAgGridProps) {
  const gridRef = useRef<AgGridReact<FinancialRecord>>(null);
  const [quickFilterText, setQuickFilterText] = React.useState('');
  const [isDark, setIsDark] = React.useState(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  const handleExportCsv = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `PetroFinance_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`,
        skipPinnedBottom: false,
        processCellCallback: (params) => {
          if (params.column.getColId() === 'period_date') {
            return params.value;
          }
          if (typeof params.value === 'number') {
            return params.value.toFixed(2);
          }
          return params.value;
        },
      });
    }
  }, []);

  const pinnedBottomRowData = useMemo(() => {
    if (!summary || (!summary.total_budget && !summary.total_actual)) return [];
    return [
      {
        record_id: 'summary_total_row',
        period_date: 'TOTAL',
        business_unit_id: 'ALL',
        business_unit_name: 'All Units',
        field_id: '',
        field_name: 'All Assets',
        category: 'Consolidated Total',
        metric_type: 'Revenue',
        budget_amount: summary.total_budget,
        actual_amount: summary.total_actual,
        variance_amount: summary.total_variance,
        variance_pct: summary.total_budget > 0 ? (summary.total_variance / summary.total_budget) * 100 : 0,
        variance_status: summary.total_variance >= 0 ? 'Favorable' : 'Unfavorable',
        description: 'Grand Total Summary Row',
      } as unknown as FinancialRecord,
    ];
  }, [summary]);

  // Custom cell renderers
  const PeriodRenderer = useCallback((params: ICellRendererParams<FinancialRecord>) => {
    if (params.node.isRowPinned()) {
      return <span className="font-bold text-zinc-900 text-xs tracking-wider">TOTAL</span>;
    }
    return <span>{params.value}</span>;
  }, []);

  const StatusRenderer = useCallback((params: ICellRendererParams<FinancialRecord>) => {
    if (params.node.isRowPinned()) {
      return (
        <span className="font-bold text-zinc-800 text-xs">
          {params.value}
        </span>
      );
    }
    const isFavorable = params.value === 'Favorable';
    return (
      <Badge
        variant={isFavorable ? 'favorable' : 'unfavorable'}
        className="flex items-center gap-1 font-medium text-[11px] h-6 px-2"
      >
        {isFavorable ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        <span>{params.value}</span>
      </Badge>
    );
  }, []);

  const VarianceRenderer = useCallback((params: ICellRendererParams<FinancialRecord>) => {
    const val = params.value as number;
    const isFavorable = params.data?.variance_status === 'Favorable';
    const isPinned = params.node.isRowPinned();
    const sign = val > 0 ? '+' : '';
    return (
      <div className={`font-mono text-xs ${isPinned ? 'font-bold' : 'font-semibold'} ${isFavorable ? 'text-emerald-700' : 'text-rose-600'}`}>
        {sign}{formatSAR(val)}
      </div>
    );
  }, []);

  const VariancePctRenderer = useCallback((params: ICellRendererParams<FinancialRecord>) => {
    const val = params.value as number;
    const isFavorable = params.data?.variance_status === 'Favorable';
    const isPinned = params.node.isRowPinned();
    return (
      <span className={`font-mono text-xs ${isPinned ? 'font-bold' : 'font-medium'} ${isFavorable ? 'text-emerald-700' : 'text-rose-600'}`}>
        {formatPercent(val)}
      </span>
    );
  }, []);

  const AmountRenderer = useCallback((params: ICellRendererParams<FinancialRecord>) => {
    const isPinned = params.node.isRowPinned();
    return (
      <span className={`font-mono text-xs ${isPinned ? 'font-bold text-zinc-900' : 'text-slate-800 font-medium'}`}>
        {formatSAR(params.value)}
      </span>
    );
  }, []);

  const MetricTypeRenderer = useCallback((params: ICellRendererParams<FinancialRecord>) => {
    if (params.node.isRowPinned()) {
      return <span className="font-bold text-zinc-700 text-xs">Consolidated</span>;
    }
    const isRevenue = params.value === 'Revenue';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${isRevenue ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
        {params.value}
      </span>
    );
  }, []);

  // Column definitions
  const columnDefs = useMemo<ColDef<FinancialRecord>[]>(() => [
    {
      headerName: 'Period',
      field: 'period_date',
      width: 110,
      minWidth: 100,
      cellRenderer: PeriodRenderer,
      filter: true,
      sort: 'desc',
      pinned: 'left',
    },
    {
      headerName: 'Business Unit',
      field: 'business_unit_name',
      width: 190,
      minWidth: 150,
      filter: true,
    },
    {
      headerName: 'Oil Field / Asset',
      field: 'field_name',
      width: 180,
      minWidth: 140,
      filter: true,
    },
    {
      headerName: 'Category',
      field: 'category',
      width: 220,
      minWidth: 160,
      filter: true,
    },
    {
      headerName: 'Type',
      field: 'metric_type',
      width: 130,
      minWidth: 110,
      cellRenderer: MetricTypeRenderer,
      filter: true,
    },
    {
      headerName: 'Budget (SAR)',
      field: 'budget_amount',
      width: 150,
      minWidth: 130,
      cellRenderer: AmountRenderer,
      type: 'numericColumn',
    },
    {
      headerName: 'Actual (SAR)',
      field: 'actual_amount',
      width: 150,
      minWidth: 130,
      cellRenderer: AmountRenderer,
      type: 'numericColumn',
    },
    {
      headerName: 'Variance (SAR)',
      field: 'variance_amount',
      width: 160,
      minWidth: 140,
      cellRenderer: VarianceRenderer,
      type: 'numericColumn',
    },
    {
      headerName: 'Var %',
      field: 'variance_pct',
      width: 110,
      minWidth: 90,
      cellRenderer: VariancePctRenderer,
      type: 'numericColumn',
    },
    {
      headerName: 'Status',
      field: 'variance_status',
      width: 130,
      minWidth: 120,
      cellRenderer: StatusRenderer,
      filter: true,
    },
    {
      headerName: 'Description',
      field: 'description',
      width: 240,
      minWidth: 180,
    },
  ], [AmountRenderer, MetricTypeRenderer, PeriodRenderer, StatusRenderer, VariancePctRenderer, VarianceRenderer]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: false,
  }), []);

  return (
    <div className="flex flex-col space-y-3">
      {/* Grid Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            <Input
              placeholder="Search financial records..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="pl-9 h-9 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {summary && (
          <div className="hidden lg:flex items-center gap-6 px-4 py-1 bg-slate-50 dark:bg-zinc-900 rounded border border-slate-200/80 dark:border-zinc-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Budget: </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{formatSAR(summary.total_budget, true)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Actual: </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{formatSAR(summary.total_actual, true)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Variance: </span>
              <span className={`font-mono font-semibold ${summary.total_variance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {summary.total_variance > 0 ? '+' : ''}{formatSAR(summary.total_variance, true)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {totalCount !== undefined && (
            <span className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:inline mr-2">
              Showing <span className="font-semibold text-slate-800 dark:text-zinc-200">{rowData.length}</span> of {totalCount} records
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={rowData.length === 0}
            className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm" style={{ height: '560px' }}>
        {error ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
            <h4 className="font-semibold text-slate-800 dark:text-zinc-200">Failed to load report data</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1 mb-4">{error}</p>
            {onRetry && (
              <Button size="sm" onClick={onRetry} className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full h-full">
            <AgGridReact<FinancialRecord>
              ref={gridRef}
              theme={isDark ? enterpriseGridDarkTheme : enterpriseGridTheme}
              rowData={rowData}
              pinnedBottomRowData={pinnedBottomRowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={50}
              paginationPageSizeSelector={[25, 50, 100]}
              quickFilterText={quickFilterText}
              onGridReady={onGridReady}
              animateRows={false}
              loading={isLoading}
              overlayNoRowsTemplate="<span class='text-xs text-slate-500 dark:text-zinc-400 p-4'>No matching financial records found for current filters.</span>"
              overlayLoadingTemplate="<span class='text-xs text-slate-600 dark:text-zinc-300 font-medium p-4'>Loading financial records...</span>"
            />
          </div>
        )}
      </div>
    </div>
  );
}

