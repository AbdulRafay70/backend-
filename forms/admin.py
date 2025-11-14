from django.contrib import admin
from .models import DynamicForm, FormSubmission


@admin.register(DynamicForm)
class DynamicFormAdmin(admin.ModelAdmin):
    list_display = [
        'form_title',
        'form_unique_id',
        'status',
        'display_position',
        'linked_blog',
        'organization',
        'submission_count',
        'created_at'
    ]
    
    list_filter = [
        'status',
        'display_position',
        'is_linked_with_blog',
        'organization',
        'created_at'
    ]
    
    search_fields = [
        'form_title',
        'form_unique_id',
        'form_page_url',
        'linked_blog__title'
    ]
    
    readonly_fields = [
        'form_unique_id',
        'form_page_url',
        'submission_count',
        'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'form_title',
                'form_unique_id',
                'status',
                'organization',
                'branch',
                'created_by'
            )
        }),
        ('Display Configuration', {
            'fields': (
                'display_position',
                'is_linked_with_blog',
                'linked_blog',
                'form_page_url',
                'form_header_image'
            )
        }),
        ('Form Structure', {
            'fields': (
                'fields',
                'buttons',
                'notes',
                'custom_css'
            )
        }),
        ('Metadata & Tracking', {
            'fields': (
                'meta',
                'submission_count',
                'created_at',
                'updated_at'
            )
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make created_by readonly after creation"""
        if obj:  # editing an existing object
            return self.readonly_fields + ('created_by',)
        return self.readonly_fields


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'form',
        'lead',
        'created_at',
        'ip_address'
    ]
    
    list_filter = [
        'form',
        'created_at'
    ]
    
    search_fields = [
        'form__form_title',
        'form__form_unique_id',
        'lead__customer_full_name',
        'lead__contact_number',
        'ip_address'
    ]
    
    readonly_fields = [
        'form',
        'lead',
        'submission_data',
        'ip_address',
        'user_agent',
        'referrer',
        'created_at'
    ]
    
    def has_add_permission(self, request):
        """Prevent manual creation of submissions"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Make submissions read-only"""
        return False
