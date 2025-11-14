from django.contrib import admin
from .models import Customer, Lead, FollowUpHistory, LoanCommitment


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "phone", "email", "branch", "organization", "last_activity")
    search_fields = ("full_name", "phone", "email")


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "phone", "email", "status", "branch", "organization")
    search_fields = ("full_name", "phone", "email", "passport_number")


@admin.register(FollowUpHistory)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ("id", "lead", "followup_date", "created_by", "created_at")


@admin.register(LoanCommitment)
class LoanCommitmentAdmin(admin.ModelAdmin):
    list_display = ("id", "lead", "booking", "promised_clear_date", "status")
