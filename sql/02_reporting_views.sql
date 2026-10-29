-- =============================================================================
-- PetroFinance BI - BigQuery Reporting Views & Analytical Queries
-- Dataset: petrofinance
-- =============================================================================

-- View 1: Monthly Financial Trend Summary (Revenue vs OPEX vs Budget)
CREATE OR REPLACE VIEW `petrofinance.v_monthly_financial_summary` AS
WITH aggregated AS (
  SELECT
    f.period_date,
    f.business_unit_id,
    bu.business_unit_name,
    SUM(CASE WHEN f.metric_type = 'Revenue' AND f.scenario = 'Actual' THEN f.amount_sar ELSE 0 END) AS actual_revenue,
    SUM(CASE WHEN f.metric_type = 'Revenue' AND f.scenario = 'Budget' THEN f.amount_sar ELSE 0 END) AS budget_revenue,
    SUM(CASE WHEN f.metric_type = 'Operating Expense' AND f.scenario = 'Actual' THEN f.amount_sar ELSE 0 END) AS actual_opex,
    SUM(CASE WHEN f.metric_type = 'Operating Expense' AND f.scenario = 'Budget' THEN f.amount_sar ELSE 0 END) AS budget_opex
  FROM `petrofinance.fact_financials` f
  LEFT JOIN `petrofinance.dim_business_unit` bu ON f.business_unit_id = bu.business_unit_id
  GROUP BY f.period_date, f.business_unit_id, bu.business_unit_name
)
SELECT
  period_date,
  business_unit_id,
  business_unit_name,
  actual_revenue,
  budget_revenue,
  (actual_revenue - budget_revenue) AS revenue_variance,
  SAFE_DIVIDE((actual_revenue - budget_revenue) * 100, budget_revenue) AS revenue_variance_pct,
  actual_opex,
  budget_opex,
  (actual_opex - budget_opex) AS opex_variance,
  SAFE_DIVIDE((actual_opex - budget_opex) * 100, budget_opex) AS opex_variance_pct,
  (actual_revenue - actual_opex) AS operating_profit,
  SAFE_DIVIDE((actual_revenue - actual_opex) * 100, actual_revenue) AS operating_profit_margin_pct
FROM aggregated;

-- View 2: Financial Report Grid View (Pivoted Actual vs Budget per Category)
CREATE OR REPLACE VIEW `petrofinance.v_financial_grid_details` AS
WITH categorized AS (
  SELECT
    f.period_date,
    f.business_unit_id,
    bu.business_unit_name,
    COALESCE(f.field_id, '') AS field_id,
    COALESCE(fl.field_name, 'Non-field / Corporate') AS field_name,
    f.category,
    f.metric_type,
    SUM(CASE WHEN f.scenario = 'Actual' THEN f.amount_sar ELSE 0 END) AS actual_amount,
    SUM(CASE WHEN f.scenario = 'Budget' THEN f.amount_sar ELSE 0 END) AS budget_amount
  FROM `petrofinance.fact_financials` f
  LEFT JOIN `petrofinance.dim_business_unit` bu ON f.business_unit_id = bu.business_unit_id
  LEFT JOIN `petrofinance.dim_oil_field` fl ON f.field_id = fl.field_id
  GROUP BY f.period_date, f.business_unit_id, bu.business_unit_name, f.field_id, fl.field_name, f.category, f.metric_type
)
SELECT
  period_date,
  business_unit_id,
  business_unit_name,
  field_id,
  field_name,
  category,
  metric_type,
  budget_amount,
  actual_amount,
  -- For Revenue: Actual - Budget (positive is favorable)
  -- For OPEX: Actual - Budget (positive is overspend / unfavorable)
  (actual_amount - budget_amount) AS variance_amount,
  SAFE_DIVIDE((actual_amount - budget_amount) * 100, budget_amount) AS variance_pct,
  CASE
    WHEN metric_type = 'Revenue' AND actual_amount >= budget_amount THEN 'Favorable'
    WHEN metric_type = 'Revenue' AND actual_amount < budget_amount THEN 'Unfavorable'
    WHEN metric_type = 'Operating Expense' AND actual_amount <= budget_amount THEN 'Favorable'
    ELSE 'Unfavorable'
  END AS variance_status
FROM categorized;

-- View 3: Production & Cost Analysis View
CREATE OR REPLACE VIEW `petrofinance.v_production_analysis` AS
SELECT
  p.period_date,
  p.field_id,
  f.field_name,
  f.region,
  f.field_type,
  p.barrels_produced,
  p.realized_price_sar_per_barrel,
  ROUND(p.barrels_produced * p.realized_price_sar_per_barrel, 2) AS estimated_gross_sales_sar
FROM `petrofinance.fact_production` p
LEFT JOIN `petrofinance.dim_oil_field` f ON p.field_id = f.field_id;

