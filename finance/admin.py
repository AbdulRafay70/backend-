from django.contrib import admin
from .models import ChartOfAccount, TransactionJournal, AuditLog, FinancialRecord, Expense

@admin.register(ChartOfAccount)
class COAAdmin(admin.ModelAdmin):
    list_display = ("id", "organization", "name", "type", "code")

@admin.register(TransactionJournal)
class JournalAdmin(admin.ModelAdmin):
    list_display = ("id", "organization", "reference", "posted", "created_at")

@admin.register(AuditLog)
class AuditAdmin(admin.ModelAdmin):
    list_display = ("id", "actor", "action", "object_type", "timestamp")

@admin.register(FinancialRecord)
class FinancialRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "organization", "booking_id", "service_type", "profit_loss")

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("id", "organization", "category", "amount", "date")
