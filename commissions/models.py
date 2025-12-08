from django.db import models
from django.utils import timezone


class CommissionRule(models.Model):
    """
    Enhanced commission rule model supporting multiple commission types
    including basic commissions and hotel night commissions.
    """
    # Basic Info
    name = models.CharField(max_length=200, default='', help_text="Commission group name (e.g., 'Low Level', 'High Level')")
    organization_id = models.BigIntegerField(null=True, blank=True)
    branch_id = models.BigIntegerField(null=True, blank=True)
    receiver_type = models.CharField(max_length=50, default='branch', help_text="Who receives: 'branch', 'area_agent', 'employee'")
    
    # Basic Commission Values (stored as JSON)
    commission = models.JSONField(
        null=True, 
        blank=True,
        help_text="Basic commission values: {group_ticket_commission_amount, umrah_package_commission_amount}",
        default=dict
    )
    
    # Hotel Night Commission (stored as JSON array)
    hotel_night_commission = models.JSONField(
        null=True,
        blank=True,
        help_text="Array of hotel commission configs with room type rates and hotel assignments",
        default=list
    )
    
    # Legacy fields (kept for backward compatibility)
    applied_on_type = models.CharField(max_length=100, null=True, blank=True, default='')
    commission_type = models.CharField(max_length=20, null=True, blank=True, default='')
    commission_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, default=0)
    product_id = models.BigIntegerField(null=True, blank=True)
    inventory_item_id = models.BigIntegerField(null=True, blank=True)
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    condition_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Status
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "commission_rules"

    def __str__(self):
        return f"{self.name} ({self.receiver_type})" if self.name else f"Rule {self.id}"


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
