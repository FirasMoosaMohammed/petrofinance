-- =============================================================================
-- PetroFinance BI - BigQuery Schema DDL
-- Dataset: petrofinance
-- =============================================================================

-- 1. Dimension: Business Units
CREATE OR REPLACE TABLE `petrofinance.dim_business_unit` (
  business_unit_id STRING OPTIONS(description="Unique business unit identifier"),
  business_unit_name STRING OPTIONS(description="Full business unit name"),
  region STRING OPTIONS(description="Geographic operational region")
)
OPTIONS(
  description="Business unit organizational dimension for PetroFinance BI"
);

-- 2. Dimension: Oil Fields (Fictional simulated assets)
CREATE OR REPLACE TABLE `petrofinance.dim_oil_field` (
  field_id STRING OPTIONS(description="Unique oil field identifier"),
  field_name STRING OPTIONS(description="Simulated field name"),
  region STRING OPTIONS(description="Field geographical basin or region"),
  field_type STRING OPTIONS(description="Field classification e.g. Onshore Conventional, Offshore Deepwater")
)
OPTIONS(
  description="Simulated oil fields asset dimension for PetroFinance BI"
);

-- 3. Fact: Financials (Actuals & Budget)
CREATE OR REPLACE TABLE `petrofinance.fact_financials` (
  record_id STRING OPTIONS(description="Unique ledger record ID"),
  period_date DATE OPTIONS(description="First day of the reporting month"),
  business_unit_id STRING OPTIONS(description="Foreign key to dim_business_unit"),
  field_id STRING OPTIONS(description="Foreign key to dim_oil_field or empty string for corporate/downstream"),
  category STRING OPTIONS(description="Cost or Revenue classification category"),
  metric_type STRING OPTIONS(description="Classification: 'Revenue' or 'Operating Expense'"),
  scenario STRING OPTIONS(description="'Actual' or 'Budget'"),
  amount_sar NUMERIC OPTIONS(description="Financial monetary amount in Saudi Riyals (SAR)"),
  description STRING OPTIONS(description="Line item description")
)
PARTITION BY period_date
CLUSTER BY business_unit_id, metric_type, scenario
OPTIONS(
  description="Fact table holding monthly actual and budget financial line items"
);

-- 4. Fact: Production
CREATE OR REPLACE TABLE `petrofinance.fact_production` (
  period_date DATE OPTIONS(description="First day of the production month"),
  field_id STRING OPTIONS(description="Foreign key to dim_oil_field"),
  barrels_produced INT64 OPTIONS(description="Total gross barrels produced"),
  realized_price_sar_per_barrel NUMERIC OPTIONS(description="Average monthly realized market price per barrel in SAR")
)
PARTITION BY period_date
CLUSTER BY field_id
OPTIONS(
  description="Fact table holding monthly gross production volumes and realized pricing"
);

