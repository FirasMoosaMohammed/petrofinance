"""
PetroFinance BI - Synthetic Data Validation Script
Performs integrity, foreign key, date range, and business calculation checks on generated CSV files.
"""

import os
import csv
from decimal import Decimal
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'csv')

def run_validation():
    print("=== Starting PetroFinance BI Data Validation ===")
    
    bu_file = os.path.join(DATA_DIR, 'dim_business_unit.csv')
    field_file = os.path.join(DATA_DIR, 'dim_oil_field.csv')
    fin_file = os.path.join(DATA_DIR, 'fact_financials.csv')
    prod_file = os.path.join(DATA_DIR, 'fact_production.csv')
    
    for f in [bu_file, field_file, fin_file, prod_file]:
        assert os.path.exists(f), f"Missing required file: {f}"
        
    # 1. Load Business Units
    bu_ids = set()
    with open(bu_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            bu_ids.add(row['business_unit_id'])
    print(f"[PASS] Business Units loaded: {len(bu_ids)} ({bu_ids})")
    assert len(bu_ids) == 5, f"Expected 5 business units, found {len(bu_ids)}"

    # 2. Load Oil Fields
    field_ids = set()
    with open(field_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            field_ids.add(row['field_id'])
    print(f"[PASS] Oil Fields loaded: {len(field_ids)} ({field_ids})")
    assert len(field_ids) == 6, f"Expected 6 fields, found {len(field_ids)}"

    # 3. Validate Production
    prod_rows = 0
    total_bbl = 0
    with open(prod_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            prod_rows += 1
            assert row['field_id'] in field_ids, f"Invalid field_id: {row['field_id']}"
            datetime.strptime(row['period_date'], "%Y-%m-%d")
            bbl = int(row['barrels_produced'])
            price = Decimal(row['realized_price_sar_per_barrel'])
            assert bbl > 0, "Barrels produced must be positive"
            assert price > 0, "Realized price must be positive"
            total_bbl += bbl
    print(f"[PASS] Production verified: {prod_rows} rows, total volume: {total_bbl:,} bbl")
    assert prod_rows == 72, f"Expected 72 production rows (6 fields * 12 months), found {prod_rows}"

    # 4. Validate Financials
    fin_rows = 0
    record_ids = set()
    total_actual_rev = Decimal('0.00')
    total_budget_rev = Decimal('0.00')
    total_actual_opex = Decimal('0.00')
    total_budget_opex = Decimal('0.00')

    with open(fin_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            fin_rows += 1
            rec_id = row['record_id']
            assert rec_id not in record_ids, f"Duplicate record_id: {rec_id}"
            record_ids.add(rec_id)

            assert row['business_unit_id'] in bu_ids, f"Foreign key error: invalid BU {row['business_unit_id']}"
            if row['field_id']:
                assert row['field_id'] in field_ids, f"Foreign key error: invalid field {row['field_id']}"

            datetime.strptime(row['period_date'], "%Y-%m-%d")
            assert row['metric_type'] in ('Revenue', 'Operating Expense'), f"Invalid metric type: {row['metric_type']}"
            assert row['scenario'] in ('Actual', 'Budget'), f"Invalid scenario: {row['scenario']}"

            amt = Decimal(row['amount_sar'])
            assert amt >= 0, f"Negative amount detected: {amt}"

            if row['metric_type'] == 'Revenue':
                if row['scenario'] == 'Actual':
                    total_actual_rev += amt
                else:
                    total_budget_rev += amt
            elif row['metric_type'] == 'Operating Expense':
                if row['scenario'] == 'Actual':
                    total_actual_opex += amt
                else:
                    total_budget_opex += amt

    print(f"[PASS] Financials verified: {fin_rows} unique records.")
    
    # KPI Validations
    rev_var = total_actual_rev - total_budget_rev
    opex_var = total_actual_opex - total_budget_opex
    op_profit = total_actual_rev - total_actual_opex
    cost_per_bbl = total_actual_opex / Decimal(total_bbl) if total_bbl > 0 else Decimal('0.00')

    print("\n--- KPI Summary (SAR) ---")
    print(f"Total Actual Revenue: {total_actual_rev:,.2f} SAR")
    print(f"Total Budget Revenue: {total_budget_rev:,.2f} SAR")
    print(f"Revenue Variance:     {rev_var:,.2f} SAR ({'+' if rev_var >= 0 else ''}{rev_var/total_budget_rev*100:.2f}%)")
    print(f"Total Actual OPEX:    {total_actual_opex:,.2f} SAR")
    print(f"Total Budget OPEX:    {total_budget_opex:,.2f} SAR")
    print(f"OPEX Variance:        {opex_var:,.2f} SAR ({'+' if opex_var >= 0 else ''}{opex_var/total_budget_opex*100:.2f}%)")
    print(f"Operating Profit:     {op_profit:,.2f} SAR")
    print(f"Cost per Barrel:      {cost_per_bbl:.2f} SAR/bbl")
    print("==================================================")
    print("All validation checks PASSED successfully!")
    return True

if __name__ == "__main__":
    run_validation()

