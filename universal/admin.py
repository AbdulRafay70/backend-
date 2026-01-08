from django.contrib import admin
from .models import UniversalRegistration, RegistrationRule

@admin.register(UniversalRegistration)
class UniversalRegistrationAdmin(admin.ModelAdmin):
    """Universal Registration management in Django admin"""
    list_display = ('id', 'type', 'name', 'email', 'phone_display', 'status', 'is_active', 'created_at')
    list_filter = ('type', 'status', 'is_active', 'created_at')
    search_fields = ('id', 'name', 'owner_name', 'email', 'contact_no')
    readonly_fields = ('id', 'organization_id', 'branch_id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Registration Code', {
            'fields': ('id', 'type'),
            'description': 'Auto-generated ID based on type (ORG-0001, BRN-0001, etc.)'
        }),
        ('Basic Information', {
            'fields': ('name', 'owner_name', 'email', 'contact_no', 'address', 'city', 'country')
        }),
        ('Parent Relationship', {
            'fields': ('parent', 'parent_name', 'organization_id', 'branch_id'),
            'description': 'Parent entity and auto-derived IDs'
        }),
        ('Documents', {
            'fields': ('cnic', 'cnic_front', 'cnic_back', 'visiting_card', 'dts_license', 'license_no', 'ntn_no'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status', 'is_active'),
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def phone_display(self, obj):
        return obj.contact_no or '-'
    phone_display.short_description = 'Phone'


@admin.register(RegistrationRule)
class RegistrationRuleAdmin(admin.ModelAdmin):
    """Registration Rule management"""
    list_display = ('id', 'type', 'requirement_text_short', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('type', 'requirement_text', 'benefit_text')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Type', {
            'fields': ('type',)
        }),
        ('Content', {
            'fields': ('requirement_text', 'benefit_text')
        }),
        ('Optional Fields', {
            'fields': ('city_needed', 'service_allowed', 'post_available'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def requirement_text_short(self, obj):
        return obj.requirement_text[:50] + '...' if len(obj.requirement_text) > 50 else obj.requirement_text
    requirement_text_short.short_description = 'Requirements'
