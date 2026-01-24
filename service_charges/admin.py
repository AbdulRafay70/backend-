from django.contrib import admin
from .models import ServiceChargeRule, HotelServiceCharge


@admin.register(ServiceChargeRule)
class ServiceChargeRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization_id', 'branch_id', 'ticket_charge_type', 'ticket_charge_value', 'package_charge_value', 'active', 'created_at']
    list_filter = ['active', 'ticket_charge_type', 'created_at']
    search_fields = ['name']
    ordering = ['-created_at']


@admin.register(HotelServiceCharge)
class HotelServiceChargeAdmin(admin.ModelAdmin):
    list_display = ['service_charge_rule', 'quint_charge', 'quad_charge', 'triple_charge', 'double_charge', 'sharing_charge', 'other_charge', 'active', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['service_charge_rule__name']
    ordering = ['-created_at']
