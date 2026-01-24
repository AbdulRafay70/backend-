from rest_framework import serializers
from .models import CommissionRule, CommissionEarning


class CommissionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionRule
        fields = '__all__'


class CommissionEarningSerializer(serializers.ModelSerializer):
    booking_number = serializers.SerializerMethodField()
    booking_type_display = serializers.SerializerMethodField()

    class Meta:
        model = CommissionEarning
        fields = '__all__'

    def get_booking_number(self, obj):
        # 1. Try to get from extra data (fastest)
        if obj.extra and isinstance(obj.extra, dict):
            ref = obj.extra.get('booking_ref')
            if ref:
                return ref
        
        # 2. Try to fetch from DB
        if obj.booking_id:
            try:
                from booking.models import Booking
                return Booking.objects.get(id=obj.booking_id).booking_number
            except Exception:
                pass
        
        return str(obj.booking_id or '-')

    def get_booking_type_display(self, obj):
        if obj.service_type:
            return obj.service_type.replace('_', ' ').upper()
        return "BOOKING"

    def validate_commission_amount(self, value):
        if value is None:
            return 0
        if value < 0:
            raise serializers.ValidationError("commission_amount must be >= 0")
        return value
