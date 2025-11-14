from django.contrib import admin
from .models import Lead, FollowUpHistory, LoanCommitment


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("customer_full_name", "passport_number", "contact_number", "branch", "organization", "lead_status", "conversion_status")
    search_fields = ("customer_full_name", "passport_number", "contact_number")


@admin.register(FollowUpHistory)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ("lead", "followup_date", "contacted_via", "followup_result")


@admin.register(LoanCommitment)
class LoanCommitmentAdmin(admin.ModelAdmin):
    list_display = ("lead", "promised_clear_date", "status")
