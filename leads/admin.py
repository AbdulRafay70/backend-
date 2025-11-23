from django.contrib import admin
from .models import Lead, FollowUpHistory, LoanCommitment


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "customer_full_name",
        "passport_number",
        "contact_number",
        "branch",
        "organization",
        "lead_status",
        "conversion_status",
        "loan_amount",
        "recovered_amount",
        "assigned_to",
        "is_internal_task",
    )
    search_fields = ("customer_full_name", "passport_number", "contact_number")
    list_filter = ("lead_status", "conversion_status", "is_internal_task", "branch", "organization")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("customer_full_name", "passport_number", "passport_expiry", "contact_number", "email", "cnic_number", "address")}),
        ("Organization", {"fields": ("organization", "branch", "assigned_to")} ),
        ("Loan/Recovery", {"fields": ("loan_amount", "recovered_amount", "recovery_date", "loan_status")} ),
        ("Task/Internal", {"fields": ("is_internal_task", "notes", "chat_messages")} ),
        ("Status", {"fields": ("lead_source", "lead_status", "conversion_status", "interested_in")}),
    )


@admin.register(FollowUpHistory)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ("lead", "followup_date", "contacted_via", "followup_result")


@admin.register(LoanCommitment)
class LoanCommitmentAdmin(admin.ModelAdmin):
    list_display = ("lead", "promised_clear_date", "status")
