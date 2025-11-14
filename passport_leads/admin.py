from django.contrib import admin
from .models import PassportLead, PaxProfile, FollowUpLog


@admin.register(PassportLead)
class PassportLeadAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'customer_phone', 'followup_status', 'next_followup_date', 'branch_id')
    search_fields = ('customer_name', 'customer_phone', 'passport_number', 'cnic')


@admin.register(PaxProfile)
class PaxProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'passport_number')
    search_fields = ('first_name', 'passport_number')


@admin.register(FollowUpLog)
class FollowUpLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'lead', 'created_by', 'created_at')
