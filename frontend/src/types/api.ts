export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  data_mode: 'demo' | 'bigquery';
  source_status: 'demo_active' | 'connected' | 'misconfigured' | 'disconnected';
  project_id?: string;
  dataset?: string;
  detail?: string;
}

export interface BusinessUnitOption {
  id: string;
  name: string;
  region: string;
}

export interface OilFieldOption {
  id: string;
  name: string;
  region: string;
  field_type?: string;
}

export interface FilterOptions {
  periods: {
    min_date: string;
    max_date: string;
    default_start: string;
    default_end: string;
  };
  business_units: BusinessUnitOption[];
  oil_fields: OilFieldOption[];
  categories: string[];
  metric_types: string[];
}

export interface DashboardSummary {
  actual_revenue: number;
  budget_revenue: number;
  revenue_variance: number;
  revenue_variance_pct: number;
  actual_opex: number;
  budget_opex: number;
  opex_variance: number;
  opex_variance_pct: number;
  operating_profit: number;
  operating_profit_margin_pct: number;
  production_barrels: number;
  cost_per_barrel: number;
  scope: {
    start_date: string;
    end_date: string;
    business_unit_id: string;
  };
}

export interface MonthlySeriesItem {
  period_date: string;
  month_label: string;
  actual_revenue: number;
  budget_revenue: number;
  actual_opex: number;
  budget_opex: number;
  operating_profit: number;
  barrels_produced: number;
}

export interface UnfavorableCategoryItem {
  category: string;
  business_unit_name: string;
  budget_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_pct: number;
}

export interface DashboardTrends {
  monthly_series: MonthlySeriesItem[];
  top_unfavorable_categories: UnfavorableCategoryItem[];
}

export interface FinancialRecord {
  record_id: string;
  period_date: string;
  business_unit_id: string;
  business_unit_name: string;
  field_id: string;
  field_name: string;
  category: string;
  metric_type: 'Revenue' | 'Operating Expense';
  budget_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_pct: number;
  variance_status: 'Favorable' | 'Unfavorable';
  description: string;
}

export interface FinancialsReportResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: {
    total_budget: number;
    total_actual: number;
    total_variance: number;
  };
  results: FinancialRecord[];
}

export interface ProductionSummary {
  total_barrels: number;
  avg_realized_price: number;
  estimated_gross_sales: number;
  total_upstream_opex: number;
  cost_per_barrel: number;
}

export interface ProductionFieldItem {
  field_id: string;
  field_name: string;
  region: string;
  field_type: string;
  total_barrels: number;
  avg_realized_price: number;
  estimated_gross_sales: number;
}

export interface MonthlyProductionItem {
  period_date: string;
  month_label: string;
  barrels_produced: number;
  avg_price: number;
  estimated_sales: number;
}

export interface ProductionReportResponse {
  summary: ProductionSummary;
  by_field: ProductionFieldItem[];
  monthly_production: MonthlyProductionItem[];
}

