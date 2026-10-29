import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shell } from '@/components/app-shell/shell';
import type { NavPage } from '@/components/app-shell/sidebar';
import { OverviewPage } from '@/pages/overview-page';
import { FinancialReportPage } from '@/pages/financial-report-page';
import { ProductionPage } from '@/pages/production-page';
import { AboutPage } from '@/pages/about-page';
import {
  fetchHealth,
  fetchFilters,
  fetchDashboardSummary,
  fetchDashboardTrends,
  fetchFinancialsReport,
  fetchProductionReport,
  clearApiCache,
} from '@/lib/api';
import type {
  HealthStatus,
  FilterOptions,
  DashboardSummary,
  DashboardTrends,
  FinancialRecord,
  ProductionReportResponse,
} from '@/types/api';

export function App() {
  const [activePage, setActivePage] = useState<NavPage>('overview');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('petrofinance_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('petrofinance_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Filter state
  const [selectedBuId, setSelectedBuId] = useState<string>('all');
  const [selectedPeriodPreset, setSelectedPeriodPreset] = useState<string>('FY2025');
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');

  // Financial report specific filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMetricType, setSelectedMetricType] = useState<string>('all');

  // Data states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [financialSummary, setFinancialSummary] = useState<{
    total_budget: number;
    total_actual: number;
    total_variance: number;
  }>({ total_budget: 0, total_actual: 0, total_variance: 0 });
  const [production, setProduction] = useState<ProductionReportResponse | null>(null);

  // Status flags
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Period preset switcher
  const handlePeriodPresetChange = (preset: string) => {
    setSelectedPeriodPreset(preset);
    switch (preset) {
      case 'FY2025':
        setStartDate('2025-01-01');
        setEndDate('2025-12-31');
        break;
      case 'H1_2025':
        setStartDate('2025-01-01');
        setEndDate('2025-06-30');
        break;
      case 'H2_2025':
        setStartDate('2025-07-01');
        setEndDate('2025-12-31');
        break;
      case 'Q1_2025':
        setStartDate('2025-01-01');
        setEndDate('2025-03-31');
        break;
      case 'Q2_2025':
        setStartDate('2025-04-01');
        setEndDate('2025-06-30');
        break;
      case 'Q3_2025':
        setStartDate('2025-07-01');
        setEndDate('2025-09-30');
        break;
      case 'Q4_2025':
        setStartDate('2025-10-01');
        setEndDate('2025-12-31');
        break;
      default:
        break;
    }
  };

  // Load health & filter options once on mount
  useEffect(() => {
    let isMounted = true;

    async function initMetadata() {
      try {
        const [h, f] = await Promise.all([fetchHealth(), fetchFilters()]);
        if (isMounted) {
          setHealth(h);
          setFilterOptions(f);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Initial metadata load error:', err);
        }
      }
    }

    initMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch report data when filters change
  const loadData = useCallback(async () => {
    setError(null);
    setIsFetching(true);
    try {
      // Re-verify health if offline or disconnected
      fetchHealth().then((h) => setHealth(h)).catch(() => {});

      const params = {
        startDate,
        endDate,
        businessUnitId: selectedBuId,
      };

      const results = await Promise.allSettled([
        fetchDashboardSummary(params),
        fetchDashboardTrends(params),
        fetchFinancialsReport({
          ...params,
          category: selectedCategory,
          metricType: selectedMetricType,
          page: 1,
          pageSize: 200,
        }),
        fetchProductionReport(params),
      ]);

      if (results[0].status === 'fulfilled') setSummary(results[0].value);
      if (results[1].status === 'fulfilled') setTrends(results[1].value);
      if (results[2].status === 'fulfilled') {
        setFinancialRecords(results[2].value.results);
        setFinancialSummary(results[2].value.summary);
      }
      if (results[3].status === 'fulfilled') setProduction(results[3].value);

      const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      if (rejected.length === results.length) {
        setError(rejected[0].reason?.message || 'Error communicating with backend API.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with backend API.');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      setIsRefreshing(false);
    }
  }, [startDate, endDate, selectedBuId, selectedCategory, selectedMetricType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    clearApiCache();
    try {
      const h = await fetchHealth();
      setHealth(h);
    } catch {
      // ignore
    }
    await loadData();
  };

  const selectedBuName = useMemo(() => {
    if (selectedBuId === 'all') return 'All Business Units (Enterprise Consolidated)';
    const found = filterOptions?.business_units.find((b) => b.id === selectedBuId);
    return found ? found.name : selectedBuId;
  }, [selectedBuId, filterOptions]);

  const pageDetails = useMemo(() => {
    switch (activePage) {
      case 'overview':
        return {
          title: 'Executive Overview',
          subtitle: '',
        };
      case 'financial-report':
        return {
          title: 'Financial Management Report',
          subtitle: '',
        };
      case 'production':
        return {
          title: 'Production & Operational Costs',
          subtitle: '',
        };
      case 'about':
        return {
          title: 'Data Warehouse & BigQuery',
          subtitle: '',
        };
    }
  }, [activePage]);

  return (
    <Shell
      activePage={activePage}
      onPageChange={setActivePage}
      health={health}
      businessUnits={filterOptions?.business_units || [{ id: 'all', name: 'All Business Units', region: 'All' }]}
      selectedBuId={selectedBuId}
      onBuChange={setSelectedBuId}
      selectedPeriodPreset={selectedPeriodPreset}
      onPeriodPresetChange={handlePeriodPresetChange}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      pageTitle={pageDetails.title}
      pageSubtitle={pageDetails.subtitle}
      isDark={theme === 'dark'}
      onToggleTheme={toggleTheme}
    >
      {activePage === 'overview' && (
        <OverviewPage
          summary={summary}
          trends={trends}
          records={financialRecords}
          production={production}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={loadData}
          selectedBuName={selectedBuName}
          onNavigateToReports={() => setActivePage('financial-report')}
        />
      )}

      {activePage === 'financial-report' && (
        <FinancialReportPage
          records={financialRecords}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          categories={filterOptions?.categories || []}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedMetricType={selectedMetricType}
          onMetricTypeChange={setSelectedMetricType}
          summary={financialSummary}
        />
      )}

      {activePage === 'production' && (
        <ProductionPage
          production={production}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          selectedBuName={selectedBuName}
          onSelectBu={setSelectedBuId}
          onNavigateToReports={() => setActivePage('financial-report')}
        />
      )}

      {activePage === 'about' && <AboutPage health={health} />}
    </Shell>
  );
}

export default App;
