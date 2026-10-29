import os
import csv
from datetime import datetime
from decimal import Decimal
from django.conf import settings

# Path to data/csv
ROOT_DIR = getattr(settings, 'ROOT_DIR', settings.BASE_DIR.parent)
CSV_DIR = os.path.join(ROOT_DIR, 'data', 'csv')

class DemoDataService:
    def __init__(self):
        self._bu_data = None
        self._field_data = None
        self._prod_data = None
        self._fin_data = None
        self._load_data()

    def _load_data(self):
        # 1. Business units
        bu_path = os.path.join(CSV_DIR, 'dim_business_unit.csv')
        self._bu_data = {}
        if os.path.exists(bu_path):
            with open(bu_path, 'r', encoding='utf-8') as f:
                for row in csv.DictReader(f):
                    self._bu_data[row['business_unit_id']] = row

        # 2. Oil fields
        field_path = os.path.join(CSV_DIR, 'dim_oil_field.csv')
        self._field_data = {}
        if os.path.exists(field_path):
            with open(field_path, 'r', encoding='utf-8') as f:
                for row in csv.DictReader(f):
                    self._field_data[row['field_id']] = row

        # 3. Production
        prod_path = os.path.join(CSV_DIR, 'fact_production.csv')
        self._prod_data = []
        if os.path.exists(prod_path):
            with open(prod_path, 'r', encoding='utf-8') as f:
                for row in csv.DictReader(f):
                    self._prod_data.append({
                        'period_date': row['period_date'],
                        'field_id': row['field_id'],
                        'barrels_produced': int(row['barrels_produced']),
                        'realized_price_sar_per_barrel': float(row['realized_price_sar_per_barrel'])
                    })

        # 4. Financials
        fin_path = os.path.join(CSV_DIR, 'fact_financials.csv')
        self._fin_data = []
        if os.path.exists(fin_path):
            with open(fin_path, 'r', encoding='utf-8') as f:
                for row in csv.DictReader(f):
                    self._fin_data.append({
                        'record_id': row['record_id'],
                        'period_date': row['period_date'],
                        'business_unit_id': row['business_unit_id'],
                        'field_id': row['field_id'],
                        'category': row['category'],
                        'metric_type': row['metric_type'],
                        'scenario': row['scenario'],
                        'amount_sar': float(row['amount_sar']),
                        'description': row.get('description', '')
                    })

    def get_filters(self):
        periods = sorted(list(set(row['period_date'] for row in self._fin_data)))
        min_date = periods[0] if periods else "2025-01-01"
        max_date = periods[-1] if periods else "2025-12-01"
        
        bus = [{"id": "all", "name": "All Business Units", "region": "All Regions"}]
        for bu_id, bu in self._bu_data.items():
            bus.append({
                "id": bu_id,
                "name": bu['business_unit_name'],
                "region": bu['region']
            })

        fields = [{"id": "all", "name": "All Oil Fields", "region": "All"}]
        for f_id, f in self._field_data.items():
            fields.append({
                "id": f_id,
                "name": f['field_name'],
                "region": f['region'],
                "field_type": f['field_type']
            })

        categories = sorted(list(set(row['category'] for row in self._fin_data)))

        return {
            "periods": {
                "min_date": min_date,
                "max_date": max_date,
                "default_start": min_date,
                "default_end": "2025-12-31"
            },
            "business_units": bus,
            "oil_fields": fields,
            "categories": categories,
            "metric_types": ["Revenue", "Operating Expense"]
        }

    def _matches_filter(self, row_date, row_bu, start_date, end_date, business_unit_id):
        if start_date and row_date < str(start_date):
            return False
        if end_date and row_date > str(end_date):
            return False
        if business_unit_id and business_unit_id != "all" and row_bu != business_unit_id:
            return False
        return True

    def get_dashboard_summary(self, start_date=None, end_date=None, business_unit_id="all"):
        actual_rev = 0.0
        budget_rev = 0.0
        actual_opex = 0.0
        budget_opex = 0.0

        for r in self._fin_data:
            if not self._matches_filter(r['period_date'], r['business_unit_id'], start_date, end_date, business_unit_id):
                continue
            amt = r['amount_sar']
            if r['metric_type'] == 'Revenue':
                if r['scenario'] == 'Actual':
                    actual_rev += amt
                elif r['scenario'] == 'Budget':
                    budget_rev += amt
            elif r['metric_type'] == 'Operating Expense':
                if r['scenario'] == 'Actual':
                    actual_opex += amt
                elif r['scenario'] == 'Budget':
                    budget_opex += amt

        # Production calculation: only relevant for BU-UPSTREAM or all
        total_barrels = 0
        if business_unit_id in ("all", "BU-UPSTREAM"):
            for p in self._prod_data:
                p_date = p['period_date']
                if start_date and p_date < str(start_date):
                    continue
                if end_date and p_date > str(end_date):
                    continue
                total_barrels += p['barrels_produced']

        rev_variance = actual_rev - budget_rev
        rev_variance_pct = round((rev_variance / budget_rev) * 100, 2) if budget_rev > 0 else 0.0

        opex_variance = actual_opex - budget_opex
        opex_variance_pct = round((opex_variance / budget_opex) * 100, 2) if budget_opex > 0 else 0.0

        op_profit = actual_rev - actual_opex
        op_profit_margin_pct = round((op_profit / actual_rev) * 100, 2) if actual_rev > 0 else 0.0

        cost_per_barrel = round(actual_opex / total_barrels, 2) if total_barrels > 0 else 0.0

        return {
            "actual_revenue": round(actual_rev, 2),
            "budget_revenue": round(budget_rev, 2),
            "revenue_variance": round(rev_variance, 2),
            "revenue_variance_pct": rev_variance_pct,
            "actual_opex": round(actual_opex, 2),
            "budget_opex": round(budget_opex, 2),
            "opex_variance": round(opex_variance, 2),
            "opex_variance_pct": opex_variance_pct,
            "operating_profit": round(op_profit, 2),
            "operating_profit_margin_pct": op_profit_margin_pct,
            "production_barrels": total_barrels,
            "cost_per_barrel": cost_per_barrel,
            "scope": {
                "start_date": str(start_date) if start_date else "2025-01-01",
                "end_date": str(end_date) if end_date else "2025-12-31",
                "business_unit_id": business_unit_id
            }
        }

    def get_dashboard_trends(self, start_date=None, end_date=None, business_unit_id="all"):
        # Group by month
        monthly_map = {}
        for r in self._fin_data:
            if not self._matches_filter(r['period_date'], r['business_unit_id'], start_date, end_date, business_unit_id):
                continue
            p_date = r['period_date']
            if p_date not in monthly_map:
                try:
                    dt = datetime.strptime(p_date, "%Y-%m-%d")
                    label = dt.strftime("%b %Y")
                except Exception:
                    label = p_date
                monthly_map[p_date] = {
                    "period_date": p_date,
                    "month_label": label,
                    "actual_revenue": 0.0,
                    "budget_revenue": 0.0,
                    "actual_opex": 0.0,
                    "budget_opex": 0.0,
                    "operating_profit": 0.0,
                    "barrels_produced": 0
                }
            amt = r['amount_sar']
            if r['metric_type'] == 'Revenue':
                if r['scenario'] == 'Actual':
                    monthly_map[p_date]["actual_revenue"] += amt
                else:
                    monthly_map[p_date]["budget_revenue"] += amt
            elif r['metric_type'] == 'Operating Expense':
                if r['scenario'] == 'Actual':
                    monthly_map[p_date]["actual_opex"] += amt
                else:
                    monthly_map[p_date]["budget_opex"] += amt

        # Add production volume by month
        if business_unit_id in ("all", "BU-UPSTREAM"):
            for p in self._prod_data:
                p_date = p['period_date']
                if p_date in monthly_map:
                    monthly_map[p_date]["barrels_produced"] += p['barrels_produced']

        monthly_series = []
        for p_date in sorted(monthly_map.keys()):
            item = monthly_map[p_date]
            item["actual_revenue"] = round(item["actual_revenue"], 2)
            item["budget_revenue"] = round(item["budget_revenue"], 2)
            item["actual_opex"] = round(item["actual_opex"], 2)
            item["budget_opex"] = round(item["budget_opex"], 2)
            item["operating_profit"] = round(item["actual_revenue"] - item["actual_opex"], 2)
            monthly_series.append(item)

        # Top unfavorable OPEX variances by category
        cat_map = {}
        for r in self._fin_data:
            if r['metric_type'] != 'Operating Expense':
                continue
            if not self._matches_filter(r['period_date'], r['business_unit_id'], start_date, end_date, business_unit_id):
                continue
            cat = r['category']
            bu_id = r['business_unit_id']
            key = (cat, bu_id)
            if key not in cat_map:
                cat_map[key] = {
                    "category": cat,
                    "business_unit_id": bu_id,
                    "business_unit_name": self._bu_data.get(bu_id, {}).get('business_unit_name', bu_id),
                    "actual_amount": 0.0,
                    "budget_amount": 0.0,
                }
            if r['scenario'] == 'Actual':
                cat_map[key]["actual_amount"] += r['amount_sar']
            else:
                cat_map[key]["budget_amount"] += r['amount_sar']

        unfavorable_cats = []
        for v in cat_map.values():
            variance = v["actual_amount"] - v["budget_amount"]
            var_pct = round((variance / v["budget_amount"]) * 100, 2) if v["budget_amount"] > 0 else 0.0
            if variance > 0: # Overspend
                unfavorable_cats.append({
                    "category": v["category"],
                    "business_unit_name": v["business_unit_name"],
                    "budget_amount": round(v["budget_amount"], 2),
                    "actual_amount": round(v["actual_amount"], 2),
                    "variance_amount": round(variance, 2),
                    "variance_pct": var_pct
                })
        unfavorable_cats.sort(key=lambda x: x["variance_amount"], reverse=True)

        return {
            "monthly_series": monthly_series,
            "top_unfavorable_categories": unfavorable_cats[:8]
        }

    def get_financials_report(self, start_date=None, end_date=None, business_unit_id="all",
                              category="all", metric_type="all", page=1, page_size=50,
                              sort_by="period_date", sort_direction="desc"):
        # Match and pair actuals with budget for each line item
        # Key: (period_date, business_unit_id, field_id, category, metric_type)
        grouped = {}
        for r in self._fin_data:
            if not self._matches_filter(r['period_date'], r['business_unit_id'], start_date, end_date, business_unit_id):
                continue
            if category and category != "all" and r['category'] != category:
                continue
            if metric_type and metric_type != "all" and r['metric_type'] != metric_type:
                continue

            k = (r['period_date'], r['business_unit_id'], r['field_id'], r['category'], r['metric_type'])
            if k not in grouped:
                f_name = self._field_data.get(r['field_id'], {}).get('field_name', 'Corporate / Non-field') if r['field_id'] else 'Corporate / Non-field'
                bu_name = self._bu_data.get(r['business_unit_id'], {}).get('business_unit_name', r['business_unit_id'])
                grouped[k] = {
                    "record_id": r['record_id'],
                    "period_date": r['period_date'],
                    "business_unit_id": r['business_unit_id'],
                    "business_unit_name": bu_name,
                    "field_id": r['field_id'] or "",
                    "field_name": f_name,
                    "category": r['category'],
                    "metric_type": r['metric_type'],
                    "budget_amount": 0.0,
                    "actual_amount": 0.0,
                    "description": r.get('description', '')
                }
            if r['scenario'] == 'Actual':
                grouped[k]["actual_amount"] += r['amount_sar']
            else:
                grouped[k]["budget_amount"] += r['amount_sar']

        all_rows = []
        tot_budget = 0.0
        tot_actual = 0.0

        for item in grouped.values():
            b_amt = round(item["budget_amount"], 2)
            a_amt = round(item["actual_amount"], 2)
            item["budget_amount"] = b_amt
            item["actual_amount"] = a_amt
            tot_budget += b_amt
            tot_actual += a_amt

            var_amt = round(a_amt - b_amt, 2)
            item["variance_amount"] = var_amt
            var_pct = round((var_amt / b_amt) * 100, 2) if b_amt > 0 else 0.0
            item["variance_pct"] = var_pct

            # Status determination
            if item["metric_type"] == "Revenue":
                item["variance_status"] = "Favorable" if var_amt >= 0 else "Unfavorable"
            else:
                item["variance_status"] = "Favorable" if var_amt <= 0 else "Unfavorable"

            all_rows.append(item)

        # Sorting
        reverse = (sort_direction == "desc")
        if sort_by in ["period_date", "category", "business_unit_name", "variance_status", "metric_type"]:
            all_rows.sort(key=lambda x: str(x.get(sort_by, '')), reverse=reverse)
        elif sort_by in ["actual_amount", "budget_amount", "variance_amount", "variance_pct"]:
            all_rows.sort(key=lambda x: float(x.get(sort_by, 0.0)), reverse=reverse)
        else:
            all_rows.sort(key=lambda x: x["period_date"], reverse=True)

        # Pagination
        total_count = len(all_rows)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_rows = all_rows[start_idx:end_idx]

        total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 1

        return {
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "summary": {
                "total_budget": round(tot_budget, 2),
                "total_actual": round(tot_actual, 2),
                "total_variance": round(tot_actual - tot_budget, 2)
            },
            "results": paginated_rows
        }

    def get_production_report(self, start_date=None, end_date=None, business_unit_id="all"):
        if business_unit_id not in ("all", "BU-UPSTREAM"):
            return {
                "summary": {
                    "total_barrels": 0,
                    "avg_realized_price": 0.0,
                    "estimated_gross_sales": 0.0,
                    "cost_per_barrel": 0.0
                },
                "by_field": [],
                "monthly_production": []
            }

        filtered_prod = []
        for p in self._prod_data:
            p_date = p['period_date']
            if start_date and p_date < str(start_date):
                continue
            if end_date and p_date > str(end_date):
                continue
            filtered_prod.append(p)

        # Field aggregations
        field_map = {}
        for p in filtered_prod:
            f_id = p['field_id']
            if f_id not in field_map:
                f_meta = self._field_data.get(f_id, {})
                field_map[f_id] = {
                    "field_id": f_id,
                    "field_name": f_meta.get('field_name', f_id),
                    "region": f_meta.get('region', ''),
                    "field_type": f_meta.get('field_type', ''),
                    "total_barrels": 0,
                    "weighted_sales": 0.0
                }
            bbl = p['barrels_produced']
            price = p['realized_price_sar_per_barrel']
            field_map[f_id]["total_barrels"] += bbl
            field_map[f_id]["weighted_sales"] += (bbl * price)

        by_field = []
        tot_bbl = 0
        tot_sales = 0.0
        for f in field_map.values():
            f_bbl = f["total_barrels"]
            tot_bbl += f_bbl
            tot_sales += f["weighted_sales"]
            avg_p = round(f["weighted_sales"] / f_bbl, 2) if f_bbl > 0 else 0.0
            by_field.append({
                "field_id": f["field_id"],
                "field_name": f["field_name"],
                "region": f["region"],
                "field_type": f["field_type"],
                "total_barrels": f_bbl,
                "avg_realized_price": avg_p,
                "estimated_gross_sales": round(f["weighted_sales"], 2)
            })
        by_field.sort(key=lambda x: x["total_barrels"], reverse=True)

        # Monthly aggregation
        m_map = {}
        for p in filtered_prod:
            p_date = p['period_date']
            if p_date not in m_map:
                try:
                    dt = datetime.strptime(p_date, "%Y-%m-%d")
                    label = dt.strftime("%b %Y")
                except Exception:
                    label = p_date
                m_map[p_date] = {
                    "period_date": p_date,
                    "month_label": label,
                    "barrels_produced": 0,
                    "weighted_sales": 0.0
                }
            bbl = p['barrels_produced']
            m_map[p_date]["barrels_produced"] += bbl
            m_map[p_date]["weighted_sales"] += (bbl * p['realized_price_sar_per_barrel'])

        monthly_prod = []
        for p_date in sorted(m_map.keys()):
            item = m_map[p_date]
            b_cnt = item["barrels_produced"]
            item["avg_price"] = round(item["weighted_sales"] / b_cnt, 2) if b_cnt > 0 else 0.0
            item["estimated_sales"] = round(item["weighted_sales"], 2)
            del item["weighted_sales"]
            monthly_prod.append(item)

        # Upstream actual OPEX for cost per barrel
        upstream_opex = 0.0
        for r in self._fin_data:
            if r['business_unit_id'] == 'BU-UPSTREAM' and r['metric_type'] == 'Operating Expense' and r['scenario'] == 'Actual':
                if not self._matches_filter(r['period_date'], r['business_unit_id'], start_date, end_date, business_unit_id):
                    continue
                upstream_opex += r['amount_sar']

        cost_per_bbl = round(upstream_opex / tot_bbl, 2) if tot_bbl > 0 else 0.0
        avg_price_total = round(tot_sales / tot_bbl, 2) if tot_bbl > 0 else 0.0

        return {
            "summary": {
                "total_barrels": tot_bbl,
                "avg_realized_price": avg_price_total,
                "estimated_gross_sales": round(tot_sales, 2),
                "total_upstream_opex": round(upstream_opex, 2),
                "cost_per_barrel": cost_per_bbl
            },
            "by_field": by_field,
            "monthly_production": monthly_prod
        }

_demo_service_instance = None
def get_demo_service():
    global _demo_service_instance
    if _demo_service_instance is None:
        _demo_service_instance = DemoDataService()
    return _demo_service_instance

