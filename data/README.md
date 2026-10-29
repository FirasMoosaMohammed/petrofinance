# PetroFinance BI — Synthetic Data Dictionary & KPI Logic

## 1. Overview
All data in this directory is **100% synthetic demonstration data** created for the PetroFinance BI prototype. It does not represent any real-world company, concession, or operational assets.

Currency: **Saudi Riyals (SAR)**  
Reporting Period: **2025-01-01 through 2025-12-31 (12 Months)**  
Random Seed: `42` (Deterministic reproducibility)

---

## 2. Table Specifications

### `dim_business_unit` (5 rows)
- `business_unit_id` (STRING): Unique BU key (e.g., `BU-UPSTREAM`, `BU-DOWNSTREAM`, `BU-REFINING`, `BU-LOGISTICS`, `BU-CORP`)
- `business_unit_name` (STRING): Management reporting unit title
- `region` (STRING): Primary operating region

### `dim_oil_field` (6 rows)
- `field_id` (STRING): Asset identifier (`FLD-NOOR`, `FLD-SAFAN-S`, `FLD-RUB-N`, `FLD-MANIFA-S`, `FLD-GHAWAR-A`, `FLD-SHAYBAH-D`)
- `field_name` (STRING): Clearly marked simulated reservoir/field name
- `region` (STRING): Geographic basin
- `field_type` (STRING): Geological classification (e.g., `Onshore Conventional`, `Offshore Deepwater`)

### `fact_financials` (1,656 rows)
- `record_id` (STRING): Unique ledger item identifier (`REC-0000001` ...)
- `period_date` (DATE): First day of reporting month (`YYYY-MM-01`)
- `business_unit_id` (STRING): Foreign key to `dim_business_unit`
- `field_id` (STRING, nullable): Foreign key to `dim_oil_field` for upstream assets; empty for corporate/downstream
- `category` (STRING): Cost or revenue classification
- `metric_type` (STRING): `'Revenue'` or `'Operating Expense'`
- `scenario` (STRING): `'Actual'` or `'Budget'`
- `amount_sar` (NUMERIC): Monetary figure in SAR
- `description` (STRING): Line item narrative

### `fact_production` (72 rows)
- `period_date` (DATE): Monthly reporting date
- `field_id` (STRING): Foreign key to `dim_oil_field`
- `barrels_produced` (INT64): Gross monthly volume in barrels
- `realized_price_sar_per_barrel` (NUMERIC): Benchmark netback price in SAR/bbl

---

## 3. KPI Definitions & Accounting Logic

1. **Actual Revenue:** $\sum \text{amount\_sar}$ where `metric_type = 'Revenue'` and `scenario = 'Actual'`.
2. **Budget Revenue:** $\sum \text{amount\_sar}$ where `metric_type = 'Revenue'` and `scenario = 'Budget'`.
3. **Revenue Variance:** $\text{Actual Revenue} - \text{Budget Revenue}$.
   - Positive variance is **Favorable** (Green).
   - Negative variance is **Unfavorable** (Red).
4. **Actual OPEX:** $\sum \text{amount\_sar}$ where `metric_type = 'Operating Expense'` and `scenario = 'Actual'`.
5. **Budget OPEX:** $\sum \text{amount\_sar}$ where `metric_type = 'Operating Expense'` and `scenario = 'Budget'`.
6. **OPEX Variance:** $\text{Actual OPEX} - \text{Budget OPEX}$.
   - Positive variance represents **Overspend** $\rightarrow$ **Unfavorable** (Red).
   - Negative variance represents **Underspend** $\rightarrow$ **Favorable** (Green).
7. **Operating Profit:** $\text{Actual Revenue} - \text{Actual OPEX}$.
8. **Operating Profit Margin:** $\frac{\text{Operating Profit}}{\text{Actual Revenue}} \times 100\%$ (safely handled when revenue is zero).
9. **Production Volume:** $\sum \text{barrels\_produced}$.
10. **Cost per Barrel (OPEX / bbl):** $\frac{\text{Actual OPEX}}{\text{Production Volume}}$ (safely handled when volume is zero).

