from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

from organization.models import Organization, Branch
from organization.models import Agency
from django.contrib.auth.models import User

SERVICE_CHOICES = [
    ("hotel", "Hotel"),
    ("ticket", "Ticket"),
    ("transport", "Transport"),
    ("visa", "Visa"),
    ("umrah", "Umrah Package"),
    ("other", "Other"),
]

EXPENSE_CATEGORIES = [
    ("hotel_cleaning", "Hotel Cleaning"),
    ("fuel", "Fuel"),
    ("staff_salary", "Staff Salary"),
    ("visa_fee", "Visa Fee"),
    ("maintenance", "Maintenance"),
    ("rent", "Rent"),
    ("other", "Other"),
]

COA_TYPES = [
    ("asset", "Asset"),
    ("liability", "Liability"),
    ("income", "Income"),
    ("expense", "Expense"),
    ("equity", "Equity"),
]


class ChartOfAccount(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="coas", db_constraint=False)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="coas", null=True, blank=True, db_constraint=False)
    code = models.CharField(max_length=64, null=True, blank=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=COA_TYPES)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children", db_constraint=False)
    auto_created = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.organization} - {self.name} ({self.code})"


class TransactionJournal(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, db_constraint=False)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, db_constraint=False)
    reference = models.CharField(max_length=255, blank=True, null=True)
    narration = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    entries = models.JSONField(default=list, blank=True)  # list of {'coa_id', 'debit','credit'}
    ledger_entry_id = models.IntegerField(null=True, blank=True)
    posted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Journal {self.id} - {self.organization}"


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    action = models.CharField(max_length=50)  # create/update/delete
    object_type = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, null=True, blank=True)
    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)
    reason = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} {self.object_type} @{self.timestamp}"


class FinancialRecord(models.Model):
    # Linked to booking where applicable
    booking_id = models.IntegerField(null=True, blank=True)
    agent = models.ForeignKey(Agency, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    reference_no = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default="active")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='financialrecords_created', db_constraint=False)
    last_updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='financialrecords_updated', db_constraint=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, db_constraint=False)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, db_constraint=False)
    service_type = models.CharField(max_length=30, choices=SERVICE_CHOICES, default="other")

    income_amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
    purchase_cost = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    expenses_amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
    profit_loss = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)

    currency = models.CharField(max_length=10, default="PKR")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"FR {self.id} org={self.organization_id} booking={self.booking_id}"


class Expense(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, db_constraint=False)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, db_constraint=False)
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES, default="other")
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=10, default="PKR")
    date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    booking_id = models.IntegerField(null=True, blank=True)
    coa = models.ForeignKey(ChartOfAccount, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    ledger_entry_id = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    module_type = models.CharField(max_length=30, choices=SERVICE_CHOICES + [("general","General")], default="general")
    payment_mode = models.CharField(max_length=20, blank=True, null=True)
    paid_to = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Expense {self.id} {self.category} {self.amount}"
