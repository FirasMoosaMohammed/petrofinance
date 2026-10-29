-- =============================================================================
-- PetroFinance BI - Validation & Verification Queries
-- Run these queries in BigQuery console to confirm dataset integrity
-- =============================================================================

-- Query 1: Table row counts check
SELECT 'dim_business_unit' AS table_name, COUNT(1) AS row_count FROM `petrofinance.dim_business_unit`
UNION ALL
SELECT 'dim_oil_field', COUNT(1) FROM `petrofinance.dim_oil_field`
UNION ALL
SELECT 'fact_production', COUNT(1) FROM `petrofinance.fact_production`
UNION ALL
SELECT 'fact_financials', COUNT(1) FROM `petrofinance.fact_financials`;

-- Query 2: Executive Annual KPI Totals
SELECT
  SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Actual' THEN amount_sar ELSE 0 END) AS total_actual_revenue_sar,
  SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Budget' THEN amount_sar ELSE 0 END) AS total_budget_revenue_sar,
  SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Actual' THEN amount_sar ELSE 0 END) -
  SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Budget' THEN amount_sar ELSE 0 END) AS revenue_variance_sar,
  SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Actual' THEN amount_sar ELSE 0 END) AS total_actual_opex_sar,
  SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Budget' THEN amount_sar ELSE 0 END) AS total_budget_opex_sar,
  SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Actual' THEN amount_sar ELSE 0 END) -
  SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Budget' THEN amount_sar ELSE 0 END) AS opex_variance_sar,
  SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Actual' THEN amount_sar ELSE 0 END) -
  SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Actual' THEN amount_sar ELSE 0 END) AS operating_profit_sar
FROM `petrofinance.fact_financials`;

-- Query 3: Production Volume and Cost per Barrel
WITH opex AS (
  SELECT SUM(amount_sar) AS total_opex
  FROM `petrofinance.fact_financials`
  WHERE metric_type = 'Operating Expense' AND scenario = 'Actual'
),
prod AS (
  SELECT SUM(barrels_produced) AS total_barrels
  FROM `petrofinance.fact_production`
)
SELECT
  prod.total_barrels,
  opex.total_opex,
  SAFE_DIVIDE(opex.total_opex, prod.total_barrels) AS cost_per_barrel_sar
FROM prod, opex;

