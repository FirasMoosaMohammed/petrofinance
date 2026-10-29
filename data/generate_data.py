"""
PetroFinance BI - Synthetic Data Generator
Generates deterministic, realistic-looking synthetic financial and production data for oil & gas management reporting.
All entities, volumes, and financial figures are completely synthetic demonstrations.
"""

import os
import csv
import random
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

SEED = 42
random.seed(SEED)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'csv')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Dimension: Business Units
BUSINESS_UNITS = [
    {"business_unit_id": "BU-UPSTREAM", "business_unit_name": "Upstream Operations", "region": "Eastern Province"},
    {"business_unit_id": "BU-DOWNSTREAM", "business_unit_name": "Downstream & Marketing", "region": "Western Province"},
    {"business_unit_id": "BU-REFINING", "business_unit_name": "Refining & Petrochemicals", "region": "Industrial Corridors"},
    {"business_unit_id": "BU-LOGISTICS", "business_unit_name": "Pipeline & Marine Logistics", "region": "Kingdom-Wide"},
    {"business_unit_id": "BU-CORP", "business_unit_name": "Corporate & Tech Services", "region": "Central Province"},
]

# 2. Dimension: Fictional Oil Fields (clearly labeled simulated)
OIL_FIELDS = [
    {"field_id": "FLD-NOOR", "field_name": "Al-Noor Reservoir (Simulated)", "region": "Eastern Province", "field_type": "Onshore Conventional"},
    {"field_id": "FLD-SAFAN-S", "field_name": "Safan Horizon (Simulated)", "region": "Arabian Gulf", "field_type": "Offshore Deepwater"},
    {"field_id": "FLD-RUB-N", "field_name": "Rub Al-Khali North (Simulated)", "region": "Southern Desert", "field_type": "Onshore Tight Sand"},
    {"field_id": "FLD-MANIFA-S", "field_name": "Manifa Sound (Simulated)", "region": "Arabian Gulf", "field_type": "Offshore Shallow Water"},
    {"field_id": "FLD-GHAWAR-A", "field_name": "Ghawar Alpha (Simulated)", "region": "Eastern Province", "field_type": "Onshore Giant Field"},
    {"field_id": "FLD-SHAYBAH-D", "field_name": "Shaybah Dunes (Simulated)", "region": "Empty Quarter", "field_type": "Onshore Desert"},
]

# Cost and Revenue Categories by BU
BU_CATEGORIES = {
    "BU-UPSTREAM": {
        "revenue": ["Crude Oil Sales", "Associated Gas Sales", "Condensate Sales"],
        "opex": ["Well Operations & Workover", "Field Gathering & Separation", "Asset Integrity & Corrosion Control", "Environmental & Produced Water Management"],
        "fields": ["FLD-NOOR", "FLD-SAFAN-S", "FLD-RUB-N", "FLD-MANIFA-S", "FLD-GHAWAR-A", "FLD-SHAYBAH-D"]
    },
    "BU-DOWNSTREAM": {
        "revenue": ["Retail Fuel Distribution", "Aviation Turbine Fuel", "Commercial Diesel & Bunker"],
        "opex": ["Terminal & Storage Operations", "Distribution Fleet Operations", "Retail Station Maintenance", "Marketing & Dealer Support"],
        "fields": [None]
    },
    "BU-REFINING": {
        "revenue": ["Refined Petrochemicals", "Polymer & Olefins Export", "Specialty Lubricants & Asphalt"],
        "opex": ["Catalytic Cracker Processing", "Energy & Steam Generation", "Turnaround & Catalyst Replacement", "Industrial Safety & Emissions"],
        "fields": [None]
    },
    "BU-LOGISTICS": {
        "revenue": ["Third-Party Pipeline Tariff", "Marine Tanker Chartering", "Terminal Throughput Fees"],
        "opex": ["Trunkline Pipeline Integrity", "Pumping Station Power & Spares", "Harbor Tug & Pilotage Operations", "Vessel Charter Lease & Fuel"],
        "fields": [None]
    },
    "BU-CORP": {
        "revenue": ["Intercompany Shared Services", "Technical Consulting Revenue"],
        "opex": ["Enterprise Cloud & SCADA Systems", "Reservoir Modeling & Exploration R&D", "Finance, Legal & Executive Administration", "Health, Safety & Environmental Audit"],
        "fields": [None]
    }
}

MONTHS_2025 = [f"2025-{m:02d}-01" for m in range(1, 13)]

# Base production parameters per field (monthly barrels ~ 400k - 2.5M, base price SAR 280 - 320/bbl)
FIELD_PROD_PARAMS = {
    "FLD-GHAWAR-A": {"base_bbl": 2_200_000, "bbl_std": 100_000, "base_price": 295.0, "price_std": 8.0},
    "FLD-SAFAN-S":  {"base_bbl": 1_650_000, "bbl_std": 85_000,  "base_price": 290.0, "price_std": 7.5},
    "FLD-NOOR":     {"base_bbl": 980_000,   "bbl_std": 50_000,  "base_price": 302.0, "price_std": 9.0},
    "FLD-SHAYBAH-D":{"base_bbl": 1_250_000, "bbl_std": 60_000,  "base_price": 305.0, "price_std": 8.5},
    "FLD-MANIFA-S": {"base_bbl": 850_000,   "bbl_std": 45_000,  "base_price": 285.0, "price_std": 7.0},
    "FLD-RUB-N":    {"base_bbl": 520_000,   "bbl_std": 35_000,  "base_price": 310.0, "price_std": 9.5},
}

def generate_dimensions():
    # Write dim_business_unit.csv
    bu_file = os.path.join(OUTPUT_DIR, 'dim_business_unit.csv')
    with open(bu_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["business_unit_id", "business_unit_name", "region"])
        writer.writeheader()
        writer.writerows(BUSINESS_UNITS)
    print(f"Written: {bu_file} ({len(BUSINESS_UNITS)} rows)")

    # Write dim_oil_field.csv
    field_file = os.path.join(OUTPUT_DIR, 'dim_oil_field.csv')
    with open(field_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["field_id", "field_name", "region", "field_type"])
        writer.writeheader()
        writer.writerows(OIL_FIELDS)
    print(f"Written: {field_file} ({len(OIL_FIELDS)} rows)")

def generate_production():
    prod_file = os.path.join(OUTPUT_DIR, 'fact_production.csv')
    rows = []
    
    # Month factor simulation (oil price seasonality/swings in 2025)
    price_multipliers = [0.96, 0.98, 1.02, 1.05, 1.04, 1.01, 1.03, 1.06, 1.02, 0.99, 0.97, 1.00]

    for month_idx, period_date in enumerate(MONTHS_2025):
        m_factor = price_multipliers[month_idx]
        for field in OIL_FIELDS:
            f_id = field["field_id"]
            params = FIELD_PROD_PARAMS[f_id]
            
            # Deterministic variation
            bbl = int(random.gauss(params["base_bbl"], params["bbl_std"]))
            bbl = max(bbl, 100_000)
            
            price = round(random.gauss(params["base_price"] * m_factor, params["price_std"]), 2)
            price = max(price, 150.0)
            
            rows.append({
                "period_date": period_date,
                "field_id": f_id,
                "barrels_produced": bbl,
                "realized_price_sar_per_barrel": f"{price:.2f}"
            })
            
    with open(prod_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["period_date", "field_id", "barrels_produced", "realized_price_sar_per_barrel"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Written: {prod_file} ({len(rows)} rows)")
    return rows

def generate_financials():
    fin_file = os.path.join(OUTPUT_DIR, 'fact_financials.csv')
    rows = []
    record_counter = 1

    # Base budget amounts per category (SAR)
    base_category_scales = {
        # Upstream (large capital & revenue)
        "Crude Oil Sales": 650_000_000,
        "Associated Gas Sales": 75_000_000,
        "Condensate Sales": 90_000_000,
        "Well Operations & Workover": 55_000_000,
        "Field Gathering & Separation": 35_000_000,
        "Asset Integrity & Corrosion Control": 20_000_000,
        "Environmental & Produced Water Management": 15_000_000,
        # Downstream
        "Retail Fuel Distribution": 220_000_000,
        "Aviation Turbine Fuel": 140_000_000,
        "Commercial Diesel & Bunker": 180_000_000,
        "Terminal & Storage Operations": 30_000_000,
        "Distribution Fleet Operations": 25_000_000,
        "Retail Station Maintenance": 18_000_000,
        "Marketing & Dealer Support": 12_000_000,
        # Refining
        "Refined Petrochemicals": 310_000_000,
        "Polymer & Olefins Export": 260_000_000,
        "Specialty Lubricants & Asphalt": 85_000_000,
        "Catalytic Cracker Processing": 65_000_000,
        "Energy & Steam Generation": 45_000_000,
        "Turnaround & Catalyst Replacement": 35_000_000,
        "Industrial Safety & Emissions": 16_000_000,
        # Logistics
        "Third-Party Pipeline Tariff": 95_000_000,
        "Marine Tanker Chartering": 80_000_000,
        "Terminal Throughput Fees": 50_000_000,
        "Trunkline Pipeline Integrity": 28_000_000,
        "Pumping Station Power & Spares": 24_000_000,
        "Harbor Tug & Pilotage Operations": 16_000_000,
        "Vessel Charter Lease & Fuel": 32_000_000,
        # Corporate
        "Intercompany Shared Services": 45_000_000,
        "Technical Consulting Revenue": 25_000_000,
        "Enterprise Cloud & SCADA Systems": 22_000_000,
        "Reservoir Modeling & Exploration R&D": 30_000_000,
        "Finance, Legal & Executive Administration": 18_000_000,
        "Health, Safety & Environmental Audit": 10_000_000,
    }

    for period_date in MONTHS_2025:
        for bu in BUSINESS_UNITS:
            bu_id = bu["business_unit_id"]
            cfg = BU_CATEGORIES[bu_id]
            fields = cfg["fields"]

            for field_id in fields:
                # Factor divisor if split across multiple fields
                field_divisor = len(fields) if field_id is not None else 1

                # 1. Revenue Categories
                for cat in cfg["revenue"]:
                    base_monthly = base_category_scales[cat] / field_divisor
                    # Add mild deterministic month/scenario noise
                    budget_amt = round(base_monthly * (0.95 + 0.10 * random.random()), 2)
                    # Actual amount has variance (-8% to +12%)
                    actual_var_pct = random.uniform(-0.08, 0.12)
                    actual_amt = round(budget_amt * (1.0 + actual_var_pct), 2)

                    # Budget row
                    rows.append({
                        "record_id": f"REC-{record_counter:07d}",
                        "period_date": period_date,
                        "business_unit_id": bu_id,
                        "field_id": field_id or "",
                        "category": cat,
                        "metric_type": "Revenue",
                        "scenario": "Budget",
                        "amount_sar": f"{budget_amt:.2f}",
                        "description": f"Annual Budget allocation for {cat}"
                    })
                    record_counter += 1

                    # Actual row
                    rows.append({
                        "record_id": f"REC-{record_counter:07d}",
                        "period_date": period_date,
                        "business_unit_id": bu_id,
                        "field_id": field_id or "",
                        "category": cat,
                        "metric_type": "Revenue",
                        "scenario": "Actual",
                        "amount_sar": f"{actual_amt:.2f}",
                        "description": f"Recognized revenue for {cat}"
                    })
                    record_counter += 1

                # 2. OPEX Categories
                for cat in cfg["opex"]:
                    base_monthly = base_category_scales[cat] / field_divisor
                    budget_amt = round(base_monthly * (0.95 + 0.10 * random.random()), 2)
                    # Actual OPEX has variance (-5% to +15% to simulate realistic overspend / underspend)
                    actual_var_pct = random.uniform(-0.05, 0.15)
                    actual_amt = round(budget_amt * (1.0 + actual_var_pct), 2)

                    # Budget row
                    rows.append({
                        "record_id": f"REC-{record_counter:07d}",
                        "period_date": period_date,
                        "business_unit_id": bu_id,
                        "field_id": field_id or "",
                        "category": cat,
                        "metric_type": "Operating Expense",
                        "scenario": "Budget",
                        "amount_sar": f"{budget_amt:.2f}",
                        "description": f"Target OPEX budget for {cat}"
                    })
                    record_counter += 1

                    # Actual row
                    rows.append({
                        "record_id": f"REC-{record_counter:07d}",
                        "period_date": period_date,
                        "business_unit_id": bu_id,
                        "field_id": field_id or "",
                        "category": cat,
                        "metric_type": "Operating Expense",
                        "scenario": "Actual",
                        "amount_sar": f"{actual_amt:.2f}",
                        "description": f"Incurred OPEX for {cat}"
                    })
                    record_counter += 1

    with open(fin_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ["record_id", "period_date", "business_unit_id", "field_id", "category", "metric_type", "scenario", "amount_sar", "description"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Written: {fin_file} ({len(rows)} rows)")
    return rows

if __name__ == "__main__":
    print("Generating PetroFinance BI Synthetic Demonstration Dataset...")
    generate_dimensions()
    prod = generate_production()
    fin = generate_financials()
    print("Generation complete.")

