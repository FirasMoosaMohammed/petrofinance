from rest_framework import serializers
from datetime import datetime

class DateFilterSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False, default=None)
    end_date = serializers.DateField(required=False, default=None)
    business_unit_id = serializers.CharField(required=False, default="all")

    def validate(self, data):
        start = data.get('start_date')
        end = data.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError("start_date cannot be later than end_date.")
        return data

class FinancialReportFilterSerializer(DateFilterSerializer):
    category = serializers.CharField(required=False, default="all")
    metric_type = serializers.CharField(required=False, default="all")
    page = serializers.IntegerField(required=False, default=1, min_value=1)
    page_size = serializers.IntegerField(required=False, default=50, min_value=1, max_value=200)
    sort_by = serializers.CharField(required=False, default="period_date")
    sort_direction = serializers.ChoiceField(choices=["asc", "desc"], default="desc")

