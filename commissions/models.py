from django.db import models
from django.utils import timezone


class CommissionRule(models.Model):
    # Commission rules stored per organization/branch
    organization_id = models.BigIntegerField(null=True, blank=True)
    branch_id = models.BigIntegerField(null=True, blank=True)
    applied_on_type = models.CharField(max_length=100)  # e.g. 'booking', 'hotel', 'flight'
    receiver_type = models.CharField(max_length=50)  # 'branch', 'area_agent', 'employee'
    commission_type = models.CharField(max_length=20)  # 'percentage' or 'flat'
    commission_value = models.DecimalField(max_digits=12, decimal_places=2)
    # Optional matching fields
    product_id = models.BigIntegerField(null=True, blank=True)
    inventory_item_id = models.BigIntegerField(null=True, blank=True)
    # Optional min/max thresholds for booking amount to apply this rule
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    condition_type = models.CharField(max_length=50, null=True, blank=True)  # optional condition
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "commission_rules"

    def __str__(self):
        return f"Rule {self.id} {self.receiver_type} {self.commission_type} {self.commission_value}"


class CommissionEarning(models.Model):
    STATUS_CHOICES = (('pending', 'Pending'), ('earned', 'Earned'), ('paid', 'Paid'), ('cancelled', 'Cancelled'))

    booking_id = models.BigIntegerField(null=True, blank=True)
    service_type = models.CharField(max_length=100, null=True, blank=True)
    earned_by_type = models.CharField(max_length=50)  # 'branch', 'area_agent', 'employee'
    earned_by_id = models.BigIntegerField(null=True, blank=True)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    redeemed = models.BooleanField(default=False)
    redeemed_date = models.DateTimeField(null=True, blank=True)
    ledger_tx_ref = models.CharField(max_length=255, null=True, blank=True)
    extra = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "commission_earnings"
        indexes = [
            models.Index(fields=['booking_id']),
            models.Index(fields=['status']),
            models.Index(fields=['redeemed']),
        ]

    def __str__(self):
        return f"Earning {self.id} booking:{self.booking_id} amount:{self.commission_amount} status:{self.status}"
