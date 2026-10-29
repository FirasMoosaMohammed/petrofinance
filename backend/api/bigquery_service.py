import os
import time
from datetime import datetime
from django.conf import settings
import google.cloud.bigquery as bigquery
import google.oauth2.service_account as service_account

class BigQueryDataService:
    def __init__(self, project_id="petrofinance", dataset_id="petrofinance_bi"):
        self.project_id = project_id or "petrofinance"
        self.dataset_id = dataset_id or "petrofinance_bi"
        self._client = None
        self._cache = {}
        self.CACHE_TTL = 300  # 5 minutes in-memory cache for top enterprise speed

    def _get_from_cache(self, key):
        if key in self._cache:
            ts, data = self._cache[key]
            if time.time() - ts < self.CACHE_TTL:
                return data
            del self._cache[key]
        return None

    def _set_cache(self, key, data):
        self._cache[key] = (time.time(), data)

    def _get_client(self):
        if self._client is None:
            cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', '')
            if not cred_path or not os.path.exists(cred_path):
                candidate1 = os.path.join(settings.BASE_DIR, 'service_account.json')
                candidate2 = os.path.join(settings.ROOT_DIR, 'service_account.json')
                if os.path.exists(candidate1):
                    cred_path = candidate1
                elif os.path.exists(candidate2):
                    cred_path = candidate2

            if cred_path and os.path.exists(cred_path):
                creds = service_account.Credentials.from_service_account_file(cred_path)
                self._client = bigquery.Client(credentials=creds, project=self.project_id or creds.project_id)
            else:
                self._client = bigquery.Client(project=self.project_id)
        return self._client

    def test_connection(self):
        try:
            client = self._get_client()
            job = client.query("SELECT 1 AS alive")
            rows = list(job.result())
            return rows and rows[0]['alive'] == 1, "Connection successful"
        except Exception as e:
            return False, str(e)

    def get_filters(self):
        cache_key = "filters"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        client = self._get_client()

        bu_query = f"""
            SELECT business_unit_id AS id, business_unit_name AS name, region
            FROM `{self.project_id}.{self.dataset_id}.dim_business_unit`
            ORDER BY business_unit_name
        """
        bu_rows = [{"id": "all", "name": "All Business Units", "region": "All Regions"}]
        try:
            for row in client.query(bu_query).result():
                bu_rows.append(dict(row))
        except Exception:
            pass

        f_query = f"""
            SELECT field_id AS id, field_name AS name, region, field_type
            FROM `{self.project_id}.{self.dataset_id}.dim_oil_field`
            ORDER BY field_name
        """
        field_rows = [{"id": "all", "name": "All Oil Fields", "region": "All"}]
        try:
            for row in client.query(f_query).result():
                field_rows.append(dict(row))
        except Exception:
            pass

        cat_query = f"""
            SELECT DISTINCT category
            FROM `{self.project_id}.{self.dataset_id}.fact_financials`
            ORDER BY category
        """
        categories = []
        try:
            for row in client.query(cat_query).result():
                categories.append(row['category'])
        except Exception:
            pass

        period_query = f"""
            SELECT MIN(period_date) AS min_date, MAX(period_date) AS max_date
            FROM `{self.project_id}.{self.dataset_id}.fact_financials`
        """
        min_d = "2025-01-01"
        max_d = "2025-12-01"
        try:
            p_res = list(client.query(period_query).result())
            if p_res and p_res[0]['min_date']:
                min_d = str(p_res[0]['min_date'])
                max_d = str(p_res[0]['max_date'])
        except Exception:
            pass

        result = {
            "periods": {
                "min_date": min_d,
                "max_date": max_d,
                "default_start": min_d,
                "default_end": "2025-12-31"
            },
            "business_units": bu_rows,
            "oil_fields": field_rows,
            "categories": categories,
            "metric_types": ["Revenue", "Operating Expense"]
        }
        self._set_cache(cache_key, result)
        return result

    def get_dashboard_summary(self, start_date=None, end_date=None, business_unit_id="all"):
        cache_key = f"summary_{start_date}_{end_date}_{business_unit_id}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        client = self._get_client()

        params = []
        where_clauses = ["1=1"]

        if start_date:
            where_clauses.append("period_date >= @start_date")
            params.append(bigquery.ScalarQueryParameter("start_date", "DATE", str(start_date)))
        if end_date:
            where_clauses.append("period_date <= @end_date")
            params.append(bigquery.ScalarQueryParameter("end_date", "DATE", str(end_date)))
        if business_unit_id and business_unit_id != "all":
            where_clauses.append("business_unit_id = @bu_id")
            params.append(bigquery.ScalarQueryParameter("bu_id", "STRING", business_unit_id))

        where_sql = " AND ".join(where_clauses)

        fin_sql = f"""
            SELECT
              COALESCE(SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Actual' THEN amount_sar END), 0) AS actual_revenue,
              COALESCE(SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Budget' THEN amount_sar END), 0) AS budget_revenue,
              COALESCE(SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Actual' THEN amount_sar END), 0) AS actual_opex,
              COALESCE(SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Budget' THEN amount_sar END), 0) AS budget_opex
            FROM `{self.project_id}.{self.dataset_id}.fact_financials`
            WHERE {where_sql}
        """
        job_config = bigquery.QueryJobConfig(query_parameters=params)
        fin_row = list(client.query(fin_sql, job_config=job_config).result())[0]

        actual_rev = float(fin_row['actual_revenue'])
        budget_rev = float(fin_row['budget_revenue'])
        actual_opex = float(fin_row['actual_opex'])
        budget_opex = float(fin_row['budget_opex'])

        total_barrels = 0
        if business_unit_id in ("all", "BU-UPSTREAM"):
            prod_where = ["1=1"]
            prod_params = []
            if start_date:
                prod_where.append("period_date >= @start_date")
                prod_params.append(bigquery.ScalarQueryParameter("start_date", "DATE", str(start_date)))
            if end_date:
                prod_where.append("period_date <= @end_date")
                prod_params.append(bigquery.ScalarQueryParameter("end_date", "DATE", str(end_date)))

            prod_sql = f"""
                SELECT COALESCE(SUM(barrels_produced), 0) AS total_barrels
                FROM `{self.project_id}.{self.dataset_id}.fact_production`
                WHERE {" AND ".join(prod_where)}
            """
            p_config = bigquery.QueryJobConfig(query_parameters=prod_params)
            p_row = list(client.query(prod_sql, job_config=p_config).result())[0]
            total_barrels = int(p_row['total_barrels'])

        rev_var = actual_rev - budget_rev
        rev_var_pct = round((rev_var / budget_rev) * 100, 2) if budget_rev > 0 else 0.0

        opex_var = actual_opex - budget_opex
        opex_var_pct = round((opex_var / budget_opex) * 100, 2) if budget_opex > 0 else 0.0

        op_profit = actual_rev - actual_opex
        op_profit_pct = round((op_profit / actual_rev) * 100, 2) if actual_rev > 0 else 0.0

        cost_per_bbl = round(actual_opex / total_barrels, 2) if total_barrels > 0 else 0.0

        result = {
            "actual_revenue": round(actual_rev, 2),
            "budget_revenue": round(budget_rev, 2),
            "revenue_variance": round(rev_var, 2),
            "revenue_variance_pct": rev_var_pct,
            "actual_opex": round(actual_opex, 2),
            "budget_opex": round(budget_opex, 2),
            "opex_variance": round(opex_var, 2),
            "opex_variance_pct": opex_var_pct,
            "operating_profit": round(op_profit, 2),
            "operating_profit_margin_pct": op_profit_pct,
            "production_barrels": total_barrels,
            "cost_per_barrel": cost_per_bbl,
            "scope": {
                "start_date": str(start_date) if start_date else "2025-01-01",
                "end_date": str(end_date) if end_date else "2025-12-31",
                "business_unit_id": business_unit_id
            }
        }
        self._set_cache(cache_key, result)
        return result

    def get_dashboard_trends(self, start_date=None, end_date=None, business_unit_id="all"):
        cache_key = f"trends_{start_date}_{end_date}_{business_unit_id}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        client = self._get_client()

        params = []
        where_clauses = ["1=1"]

        if start_date:
            where_clauses.append("period_date >= @start_date")
            params.append(bigquery.ScalarQueryParameter("start_date", "DATE", str(start_date)))
        if end_date:
            where_clauses.append("period_date <= @end_date")
            params.append(bigquery.ScalarQueryParameter("end_date", "DATE", str(end_date)))
        if business_unit_id and business_unit_id != "all":
            where_clauses.append("business_unit_id = @bu_id")
            params.append(bigquery.ScalarQueryParameter("bu_id", "STRING", business_unit_id))

        where_sql = " AND ".join(where_clauses)

        monthly_sql = f"""
            SELECT
              period_date,
              COALESCE(SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Actual' THEN amount_sar END), 0) AS actual_revenue,
              COALESCE(SUM(CASE WHEN metric_type = 'Revenue' AND scenario = 'Budget' THEN amount_sar END), 0) AS budget_revenue,
              COALESCE(SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Actual' THEN amount_sar END), 0) AS actual_opex,
              COALESCE(SUM(CASE WHEN metric_type = 'Operating Expense' AND scenario = 'Budget' THEN amount_sar END), 0) AS budget_opex
            FROM `{self.project_id}.{self.dataset_id}.fact_financials`
            WHERE {where_sql}
            GROUP BY period_date
            ORDER BY period_date
        """
        job_config = bigquery.QueryJobConfig(query_parameters=params)
        monthly_series = []
        try:
            for row in client.query(monthly_sql, job_config=job_config).result():
                p_date = str(row['period_date'])
                try:
                    dt = datetime.strptime(p_date, "%Y-%m-%d")
                    label = dt.strftime("%b %Y")
                except Exception:
                    label = p_date
                act_rev = float(row['actual_revenue'])
                act_op = float(row['actual_opex'])
                monthly_series.append({
                    "period_date": p_date,
                    "month_label": label,
                    "actual_revenue": round(act_rev, 2),
                    "budget_revenue": round(float(row['budget_revenue']), 2),
                    "actual_opex": round(act_op, 2),
                    "budget_opex": round(float(row['budget_opex']), 2),
                    "operating_profit": round(act_rev - act_op, 2),
                    "barrels_produced": 0
                })
        except Exception as e:
            print(f"Error querying monthly_sql: {e}")

        # Add production barrels to monthly series if applicable
        if business_unit_id in ("all", "BU-UPSTREAM"):
            try:
                prod_sql = f"""
                    SELECT period_date, COALESCE(SUM(barrels_produced), 0) AS barrels_produced
                    FROM `{self.project_id}.{self.dataset_id}.fact_production`
                    GROUP BY period_date
                    ORDER BY period_date
                """
                p_map = {str(r['period_date']): int(r['barrels_produced']) for r in client.query(prod_sql).result()}
                for m in monthly_series:
                    if m['period_date'] in p_map:
                        m['barrels_produced'] = p_map[m['period_date']]
            except Exception as e:
                print(f"Error querying prod_sql: {e}")

        # Top unfavorable categories - Fixed table alias prefixes so BigQuery never throws ambiguous column 400!
        top_cats_where = ["f.metric_type = 'Operating Expense'"]
        top_params = []
        if start_date:
            top_cats_where.append("f.period_date >= @start_date")
            top_params.append(bigquery.ScalarQueryParameter("start_date", "DATE", str(start_date)))
        if end_date:
            top_cats_where.append("f.period_date <= @end_date")
            top_params.append(bigquery.ScalarQueryParameter("end_date", "DATE", str(end_date)))
        if business_unit_id and business_unit_id != "all":
            top_cats_where.append("f.business_unit_id = @bu_id")
            top_params.append(bigquery.ScalarQueryParameter("bu_id", "STRING", business_unit_id))

        top_where_sql = " AND ".join(top_cats_where)

        top_cats_sql = f"""
            SELECT
              f.category,
              bu.business_unit_name,
              COALESCE(SUM(CASE WHEN f.scenario = 'Actual' THEN f.amount_sar END), 0) AS actual_amount,
              COALESCE(SUM(CASE WHEN f.scenario = 'Budget' THEN f.amount_sar END), 0) AS budget_amount,
              COALESCE(SUM(CASE WHEN f.scenario = 'Actual' THEN f.amount_sar END), 0) -
              COALESCE(SUM(CASE WHEN f.scenario = 'Budget' THEN f.amount_sar END), 0) AS variance_amount
            FROM `{self.project_id}.{self.dataset_id}.fact_financials` f
            LEFT JOIN `{self.project_id}.{self.dataset_id}.dim_business_unit` bu ON f.business_unit_id = bu.business_unit_id
            WHERE {top_where_sql}
            GROUP BY f.category, bu.business_unit_name
            HAVING variance_amount > 0
            ORDER BY variance_amount DESC
            LIMIT 8
        """
        top_cats = []
        try:
            top_config = bigquery.QueryJobConfig(query_parameters=top_params)
            for r in client.query(top_cats_sql, job_config=top_config).result():
                act = float(r['actual_amount'])
                bud = float(r['budget_amount'])
                var = float(r['variance_amount'])
                top_cats.append({
                    "category": r['category'],
                    "business_unit_name": r['business_unit_name'] or 'Corporate',
                    "actual_amount": round(act, 2),
                    "budget_amount": round(bud, 2),
                    "variance_amount": round(var, 2),
                    "variance_pct": round((var / bud) * 100, 2) if bud > 0 else 0.0
                })
        except Exception as e:
            print(f"Error querying top_cats_sql: {e}")

        result = {
            "monthly_series": monthly_series,
            "top_unfavorable_categories": top_cats
        }
        self._set_cache(cache_key, result)
        return result

    def get_financials_report(self, start_date=None, end_date=None, business_unit_id="all",
                              category="all", metric_type="all", page=1, page_size=50,
                              sort_by="period_date", sort_direction="desc"):
        cache_key = f"fin_{start_date}_{end_date}_{business_unit_id}_{category}_{metric_type}_{page}_{page_size}_{sort_by}_{sort_direction}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        from api.demo_service import get_demo_service
        result = get_demo_service().get_financials_report(
            start_date=start_date, end_date=end_date, business_unit_id=business_unit_id,
            category=category, metric_type=metric_type, page=page, page_size=page_size,
            sort_by=sort_by, sort_direction=sort_direction
        )
        self._set_cache(cache_key, result)
        return result

    def get_production_report(self, start_date=None, end_date=None, business_unit_id="all"):
        cache_key = f"prod_{start_date}_{end_date}_{business_unit_id}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        from api.demo_service import get_demo_service
        result = get_demo_service().get_production_report(
            start_date=start_date, end_date=end_date, business_unit_id=business_unit_id
        )
        self._set_cache(cache_key, result)
        return result
