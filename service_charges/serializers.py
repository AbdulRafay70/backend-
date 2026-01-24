from rest_framework import serializers
from .models import ServiceChargeRule, HotelServiceCharge


class ServiceChargeRuleSerializer(serializers.ModelSerializer):
    """Serializer for ServiceChargeRule model"""
    
    ticket_charge_type_display = serializers.CharField(source='get_ticket_charge_type_display', read_only=True)
    
    class Meta:
        model = ServiceChargeRule
        fields = [
            'id',
            'name',
            'organization_id',
            'branch_id',
            'ticket_charge_type',
            'ticket_charge_type_display',
            'ticket_charge_value',
            'package_charge_value',
            'active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HotelServiceChargeSerializer(serializers.ModelSerializer):
    """Serializer for HotelServiceCharge model"""
    
    class Meta:
        model = HotelServiceCharge
        fields = [
            'id',
            'service_charge_rule',
            'quint_charge',
            'quad_charge',
            'triple_charge',
            'double_charge',
            'sharing_charge',
            'other_charge',
            'hotel_ids',
            'active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HotelServiceChargeDetailSerializer(HotelServiceChargeSerializer):
    """Detailed serializer with nested service charge rule info"""
    
    service_charge_rule = ServiceChargeRuleSerializer(read_only=True)
    
    class Meta(HotelServiceChargeSerializer.Meta):
        fields = HotelServiceChargeSerializer.Meta.fields
