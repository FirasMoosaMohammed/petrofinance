import type {
  HealthStatus,
  FilterOptions,
  DashboardSummary,
  DashboardTrends,
  FinancialsReportResponse,
  ProductionReportResponse,
} from '@/types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// In-memory cache for fast filter switching
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearApiCache() {
  cache.clear();
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

async function fetchWithCache<T>(url: string, useCache = true): Promise<T> {
  const now = Date.now();
  if (useCache && cache.has(url)) {
    const entry = cache.get(url)!;
    if (now - entry.timestamp < CACHE_TTL_MS) {
      return entry.data as T;
    }
  }

  const res = await fetch(url);
  const data = await handleResponse<T>(res);
  if (useCache) {
    cache.set(url, { timestamp: now, data });
  }
  return data;
}

export async function fetchHealth(): Promise<HealthStatus> {
  // Always fetch live health
  const res = await fetch(`${API_BASE}/health/`);
  return handleResponse<HealthStatus>(res);
}

export async function fetchFilters(): Promise<FilterOptions> {
  return fetchWithCache<FilterOptions>(`${API_BASE}/filters/`);
}

export interface SummaryParams {
  startDate?: string;
  endDate?: string;
  businessUnitId?: string;
}

export async function fetchDashboardSummary(params: SummaryParams = {}, bypassCache = false): Promise<DashboardSummary> {
  const q = new URLSearchParams();
  if (params.startDate) q.append('start_date', params.startDate);
  if (params.endDate) q.append('end_date', params.endDate);
  if (params.businessUnitId) q.append('business_unit_id', params.businessUnitId);

  const url = `${API_BASE}/dashboard/summary/?${q.toString()}`;
  return fetchWithCache<DashboardSummary>(url, !bypassCache);
}

export async function fetchDashboardTrends(params: SummaryParams = {}, bypassCache = false): Promise<DashboardTrends> {
  const q = new URLSearchParams();
  if (params.startDate) q.append('start_date', params.startDate);
  if (params.endDate) q.append('end_date', params.endDate);
  if (params.businessUnitId) q.append('business_unit_id', params.businessUnitId);

  const url = `${API_BASE}/dashboard/trends/?${q.toString()}`;
  return fetchWithCache<DashboardTrends>(url, !bypassCache);
}

export interface FinancialReportParams extends SummaryParams {
  category?: string;
  metricType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export async function fetchFinancialsReport(params: FinancialReportParams = {}, bypassCache = false): Promise<FinancialsReportResponse> {
  const q = new URLSearchParams();
  if (params.startDate) q.append('start_date', params.startDate);
  if (params.endDate) q.append('end_date', params.endDate);
  if (params.businessUnitId) q.append('business_unit_id', params.businessUnitId);
  if (params.category) q.append('category', params.category);
  if (params.metricType) q.append('metric_type', params.metricType);
  if (params.page) q.append('page', params.page.toString());
  if (params.pageSize) q.append('page_size', params.pageSize.toString());
  if (params.sortBy) q.append('sort_by', params.sortBy);
  if (params.sortDirection) q.append('sort_direction', params.sortDirection);

  const url = `${API_BASE}/reports/financials/?${q.toString()}`;
  return fetchWithCache<FinancialsReportResponse>(url, !bypassCache);
}

export async function fetchProductionReport(params: SummaryParams = {}, bypassCache = false): Promise<ProductionReportResponse> {
  const q = new URLSearchParams();
  if (params.startDate) q.append('start_date', params.startDate);
  if (params.endDate) q.append('end_date', params.endDate);
  if (params.businessUnitId) q.append('business_unit_id', params.businessUnitId);

  const url = `${API_BASE}/reports/production/?${q.toString()}`;
  return fetchWithCache<ProductionReportResponse>(url, !bypassCache);
}

