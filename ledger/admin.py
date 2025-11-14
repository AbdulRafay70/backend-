from django.contrib import admin
from .models import Account, LedgerEntry, LedgerLine


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "account_type", "organization", "branch", "agency", "balance")
    search_fields = ("name",)



@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    readonly_fields = ("booking_no", "internal_notes", "metadata")
    list_display = ("id", "booking_no", "service_type", "creation_datetime", "reversed")
    search_fields = ("booking_no", "narration")


@admin.register(LedgerLine)
class LedgerLineAdmin(admin.ModelAdmin):
    list_display = ("id", "ledger_entry", "account", "debit", "credit", "final_balance")
    search_fields = ("account__name",)
