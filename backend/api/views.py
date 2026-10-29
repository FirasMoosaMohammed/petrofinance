from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from api.data_service import DataServiceManager
from api.serializers import DateFilterSerializer, FinancialReportFilterSerializer

@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint reporting authentic backend data source status.
    """
    info = DataServiceManager.get_source_status()
    http_status = status.HTTP_200_OK if info['status'] in ('ok', 'degraded') else status.HTTP_502_BAD_GATEWAY
    return Response(info, status=http_status)

@api_view(['GET'])
def get_filters(request):
    """
    Returns available filter ranges (periods, business units, oil fields, categories).
    """
    service = DataServiceManager.get_service()
    filters = service.get_filters()
    return Response(filters, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_dashboard_summary(request):
    """
    Returns high-level KPI summary for the selected period and business unit.
    """
    serializer = DateFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    params = serializer.validated_data
    service = DataServiceManager.get_service()
    data = service.get_dashboard_summary(
        start_date=params.get('start_date'),
        end_date=params.get('end_date'),
        business_unit_id=params.get('business_unit_id', 'all')
    )
    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_dashboard_trends(request):
    """
    Returns monthly financial trends and top unfavorable variances for charts.
    """
    serializer = DateFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    params = serializer.validated_data
    service = DataServiceManager.get_service()
    data = service.get_dashboard_trends(
        start_date=params.get('start_date'),
        end_date=params.get('end_date'),
        business_unit_id=params.get('business_unit_id', 'all')
    )
    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_financials_report(request):
    """
    Returns paginated, sorted, and filtered financial line items for the AG Grid report.
    """
    serializer = FinancialReportFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    params = serializer.validated_data
    service = DataServiceManager.get_service()
    data = service.get_financials_report(
        start_date=params.get('start_date'),
        end_date=params.get('end_date'),
        business_unit_id=params.get('business_unit_id', 'all'),
        category=params.get('category', 'all'),
        metric_type=params.get('metric_type', 'all'),
        page=params.get('page', 1),
        page_size=params.get('page_size', 50),
        sort_by=params.get('sort_by', 'period_date'),
        sort_direction=params.get('sort_direction', 'desc')
    )
    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_production_report(request):
    """
    Returns operational production and cost-per-barrel analysis data.
    """
    serializer = DateFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    params = serializer.validated_data
    service = DataServiceManager.get_service()
    data = service.get_production_report(
        start_date=params.get('start_date'),
        end_date=params.get('end_date'),
        business_unit_id=params.get('business_unit_id', 'all')
    )
    return Response(data, status=status.HTTP_200_OK)
