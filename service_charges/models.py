from django.db import models
from django.utils import timezone


class ServiceChargeRule(models.Model):
    """
    Service charge rule model for managing service charges
    that can be applied to packages, tickets, and hotels.
    """
    CHARGE_TYPE_CHOICES = (
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage'),
    )
    
    # Basic Info
    name = models.CharField(
        max_length=200, 
        help_text="Service charge group name (e.g., 'Standard Service Charge', 'Premium Service Charge')"
    )
    organization_id = models.BigIntegerField(null=True, blank=True)
    branch_id = models.BigIntegerField(null=True, blank=True)
    
    # Ticket Charges (applied to ALL tickets)
    ticket_charge_type = models.CharField(
        max_length=20, 
        choices=CHARGE_TYPE_CHOICES, 
        default='fixed',
        help_text="Type of charge for tickets: fixed amount or percentage"
    )
    ticket_charge_value = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Ticket charge value (amount for fixed, percentage for percentage type)"
    )
    
    # Package Charges (applied to ALL packages, fixed amount only)
    package_charge_value = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Package charge value (fixed amount only)"
    )
    
    # Status
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_charge_rules"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name}"


class HotelServiceCharge(models.Model):
    """
    Hotel service charges with room type breakdown.
    Multiple hotel groups can be created for the same service charge rule.
    """
    # Link to service charge rule
    service_charge_rule = models.ForeignKey(
        ServiceChargeRule,
        on_delete=models.CASCADE,
        related_name='hotel_charges'
    )
    
    # Room type charges (fixed amounts only)
    quint_charge = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Service charge for Quint room"
    )
    quad_charge = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Service charge for Quad room"
    )
    triple_charge = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Service charge for Triple room"
    )
    double_charge = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Service charge for Double room"
    )
    sharing_charge = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Service charge for Sharing room"
    )
    other_charge = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Service charge for Other room type"
    )
    
    # Hotels this charge applies to (stored as JSON array of hotel IDs)
    hotel_ids = models.JSONField(
        default=list,
        help_text="List of hotel IDs this charge applies to"
    )
    
    # Status
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hotel_service_charges"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.service_charge_rule.name} - Hotel Group"
