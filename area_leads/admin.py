from django.contrib import admin
from .models import AreaLead, LeadFollowUp, LeadConversation, LeadPaymentPromise


@admin.register(AreaLead)
class AreaLeadAdmin(admin.ModelAdmin):
    list_display = ("customer_name", "passport_number", "contact_number", "branch_id", "lead_status")
    search_fields = ("customer_name", "passport_number", "contact_number")


@admin.register(LeadFollowUp)
class LeadFollowUpAdmin(admin.ModelAdmin):
    list_display = ("lead", "next_followup_date", "followup_status")


@admin.register(LeadConversation)
class LeadConversationAdmin(admin.ModelAdmin):
    list_display = ("lead", "message_type", "recorded_by", "timestamp")


@admin.register(LeadPaymentPromise)
class LeadPaymentPromiseAdmin(admin.ModelAdmin):
    list_display = ("lead", "amount_due", "due_date", "status")
