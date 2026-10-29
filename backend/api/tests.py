from django.test import TestCase, override_settings
from rest_framework.test import APIClient

class PetroFinanceApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @override_settings(DATA_MODE='demo')
    def test_health_check_demo(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('status'), 'ok')
        self.assertEqual(data.get('data_mode'), 'demo')

    @override_settings(DATA_MODE='bigquery', GOOGLE_CLOUD_PROJECT='')
    def test_health_check_bigquery_unconfigured(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('data_mode'), 'bigquery')
        self.assertEqual(data.get('source_status'), 'misconfigured')

    def test_filters_endpoint(self):
        response = self.client.get('/api/filters/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('periods', data)
        self.assertIn('business_units', data)
        self.assertIn('oil_fields', data)
        self.assertGreaterEqual(len(data['business_units']), 5)
        self.assertGreaterEqual(len(data['oil_fields']), 6)

    def test_dashboard_summary_full_year(self):
        response = self.client.get('/api/dashboard/summary/?start_date=2025-01-01&end_date=2025-12-31&business_unit_id=all')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data['actual_revenue'], 20_000_000_000)
        self.assertGreater(data['actual_opex'], 5_000_000_000)
        self.assertGreater(data['operating_profit'], 15_000_000_000)
        self.assertGreater(data['production_barrels'], 80_000_000)
        self.assertGreater(data['cost_per_barrel'], 50.0)

        # Revenue variance check: Actual - Budget
        expected_rev_var = round(data['actual_revenue'] - data['budget_revenue'], 2)
        self.assertAlmostEqual(data['revenue_variance'], expected_rev_var, places=1)

        # OPEX variance check: Actual - Budget
        expected_opex_var = round(data['actual_opex'] - data['budget_opex'], 2)
        self.assertAlmostEqual(data['opex_variance'], expected_opex_var, places=1)

    def test_dashboard_summary_invalid_date_range(self):
        # start_date later than end_date must return HTTP 400
        response = self.client.get('/api/dashboard/summary/?start_date=2025-12-31&end_date=2025-01-01')
        self.assertEqual(response.status_code, 400)

    def test_dashboard_summary_bu_filter(self):
        # Filtering by Upstream only
        response = self.client.get('/api/dashboard/summary/?start_date=2025-01-01&end_date=2025-12-31&business_unit_id=BU-UPSTREAM')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['scope']['business_unit_id'], 'BU-UPSTREAM')
        self.assertGreater(data['production_barrels'], 0)

        # Filtering by Downstream only (has 0 production barrels)
        response_ds = self.client.get('/api/dashboard/summary/?start_date=2025-01-01&end_date=2025-12-31&business_unit_id=BU-DOWNSTREAM')
        self.assertEqual(response_ds.status_code, 200)
        data_ds = response_ds.json()
        self.assertEqual(data_ds['production_barrels'], 0)
        self.assertEqual(data_ds['cost_per_barrel'], 0.0)

    def test_dashboard_trends(self):
        response = self.client.get('/api/dashboard/trends/?start_date=2025-01-01&end_date=2025-12-31')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('monthly_series', data)
        self.assertIn('top_unfavorable_categories', data)
        self.assertEqual(len(data['monthly_series']), 12)
        self.assertGreater(len(data['top_unfavorable_categories']), 0)

    def test_financials_report_pagination_and_sorting(self):
        response = self.client.get('/api/reports/financials/?page=1&page_size=20&sort_by=amount&sort_direction=desc')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['page'], 1)
        self.assertEqual(data['page_size'], 20)
        self.assertIn('summary', data)
        self.assertIn('results', data)
        self.assertEqual(len(data['results']), 20)

        first_row = data['results'][0]
        self.assertIn('record_id', first_row)
        self.assertIn('actual_amount', first_row)
        self.assertIn('budget_amount', first_row)
        self.assertIn('variance_amount', first_row)
        self.assertIn('variance_status', first_row)

    def test_production_report(self):
        response = self.client.get('/api/reports/production/?start_date=2025-01-01&end_date=2025-12-31')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('summary', data)
        self.assertIn('by_field', data)
        self.assertIn('monthly_production', data)
        self.assertEqual(len(data['by_field']), 6)
        self.assertEqual(len(data['monthly_production']), 12)
