import os
import time
from django.conf import settings
from api.demo_service import get_demo_service

class DataServiceManager:
    _cached_service = None
    _cached_service_key = None
    _cached_status = None
    _cached_status_key = None
    _last_status_check = 0
    STATUS_CACHE_TTL = 30  # Re-check status every 30 seconds

    @classmethod
    def get_service(cls):
        mode = getattr(settings, 'DATA_MODE', 'demo').lower()
        if mode == 'bigquery':
            project_id = getattr(settings, 'GOOGLE_CLOUD_PROJECT', '')
            dataset_id = getattr(settings, 'BIGQUERY_DATASET', 'petrofinance')
            if cls._cached_service is not None and cls._cached_service_key == (project_id, dataset_id):
                return cls._cached_service

            if project_id:
                try:
                    from api.bigquery_service import BigQueryDataService
                    service = BigQueryDataService(project_id=project_id, dataset_id=dataset_id)
                    alive, _ = service.test_connection()
                    if alive:
                        cls._cached_service = service
                        cls._cached_service_key = (project_id, dataset_id)
                        return service
                except Exception:
                    pass
        # Fallback to deterministic local demo service
        return get_demo_service()

    @classmethod
    def get_source_status(cls):
        mode = getattr(settings, 'DATA_MODE', 'demo').lower()
        project_id = getattr(settings, 'GOOGLE_CLOUD_PROJECT', '')
        dataset_id = getattr(settings, 'BIGQUERY_DATASET', 'petrofinance')
        key = (mode, project_id, dataset_id)

        now = time.time()
        if cls._cached_status and cls._cached_status_key == key and (now - cls._last_status_check < cls.STATUS_CACHE_TTL):
            return cls._cached_status

        if mode == 'bigquery':
            if not project_id:
                res = {
                    'status': 'degraded',
                    'data_mode': 'bigquery',
                    'source_status': 'misconfigured',
                    'detail': 'GOOGLE_CLOUD_PROJECT is not set in environment.'
                }
            else:
                try:
                    from api.bigquery_service import BigQueryDataService
                    service = cls._cached_service or BigQueryDataService(project_id=project_id, dataset_id=dataset_id)
                    alive, msg = service.test_connection()
                    if alive:
                        cls._cached_service = service
                        res = {
                            'status': 'ok',
                            'data_mode': 'bigquery',
                            'source_status': 'connected',
                            'project_id': project_id,
                            'dataset': dataset_id,
                            'detail': 'Successfully connected to Google BigQuery'
                        }
                    else:
                        cls._cached_service = None
                        res = {
                            'status': 'degraded',
                            'data_mode': 'bigquery',
                            'source_status': 'disconnected',
                            'project_id': project_id,
                            'dataset': dataset_id,
                            'detail': f'BigQuery query failed: {msg}'
                        }
                except Exception as e:
                    cls._cached_service = None
                    res = {
                        'status': 'degraded',
                        'data_mode': 'bigquery',
                        'source_status': 'disconnected',
                        'project_id': project_id,
                        'dataset': dataset_id,
                        'detail': f'Credentials/auth error: {str(e)}'
                    }
        else:
            res = {
                'status': 'ok',
                'data_mode': 'demo',
                'source_status': 'demo_active',
                'project_id': project_id or 'local_demo',
                'dataset': dataset_id,
                'detail': 'Running in local synthetic demo mode'
            }

        cls._cached_status = res
        cls._cached_status_key = key
        cls._last_status_check = now
        return res
