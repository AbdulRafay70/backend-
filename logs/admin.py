from django.contrib import admin
from .models import SystemLog


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "action_type", "model_name", "record_id", "organization_id", "branch_id", "user_id", "status")
    list_filter = ("action_type", "model_name", "status", "organization_id")
    search_fields = ("description", "action_type", "model_name")
    readonly_fields = ("timestamp",)
