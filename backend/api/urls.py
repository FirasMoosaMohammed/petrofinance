from django.urls import path
from api import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('filters/', views.get_filters, name='filters'),
    path('dashboard/summary/', views.get_dashboard_summary, name='dashboard-summary'),
    path('dashboard/trends/', views.get_dashboard_trends, name='dashboard-trends'),
    path('reports/financials/', views.get_financials_report, name='reports-financials'),
    path('reports/production/', views.get_production_report, name='reports-production'),
]
