from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

from organization.models import Organization, Branch, Agency


class Account(models.Model):
    """
    Chart of Accounts - Foundation of double-entry bookkeeping system.
    Each account tracks a specific type of financial activity.
    """
    
    @property
    def total_debit(self):
        return self.lines.aggregate(total=models.Sum('debit'))['total'] or Decimal('0.00')

    @property
    def total_credit(self):
        return self.lines.aggregate(total=models.Sum('credit'))['total'] or Decimal('0.00')

    @property
    def final_balance_calc(self):
        # This is always total_debit - total_credit
        return self.total_debit - self.total_credit
    
    ACCOUNT_TYPE_CHOICES = [
        ("CASH", "Cash"),
        ("BANK", "Bank"),
        ("RECEIVABLE", "Receivable"),
        ("PAYABLE", "Payable"),
        ("AGENT", "Agent"),
        ("SALES", "Sales"),
        ("COMMISSION", "Commission"),
        ("SUSPENSE", "Suspense"),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="accounts", blank=True, null=True
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="accounts", blank=True, null=True
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.CASCADE, related_name="accounts", blank=True, null=True
    )
    name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=50, choices=ACCOUNT_TYPE_CHOICES, default="CASH")
    balance = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        scope = self.organization.name if self.organization else (self.branch.name if self.branch else (self.agency.name if self.agency else "Global"))
        return f"{self.name} ({self.account_type}) - {scope}"


class LedgerEntry(models.Model):
    """
    Main ledger entry record - represents a complete financial transaction.
    Each entry contains multiple lines (double-entry bookkeeping).
    Automatically created for bookings, payments, refunds, and commissions.
    
    NEW FIELDS ADDED (as per specification):
    - seller_organization_id: Who created this booking
    - transaction_amount: Total transaction amount
    - inventory_owner_organization_id: Owner of inventory item
    - area_agency_id: Linked area agent
    - payment_ids: List of linked payment records
    - group_ticket_count: Number of tickets in group
    - umrah_visa_count: Number of Umrah visas
    - hotel_nights_count: Total hotel nights
    - final_balance: Auto-calculated (total paid - total due)
    """
    
    TRANSACTION_TYPES = [
        ("debit", "Debit"),
        ("credit", "Credit"),
    ]
    
    SERVICE_TYPES = [
        ("ticket", "Ticket"),
        ("umrah", "Umrah"),
        ("hotel", "Hotel"),
        ("transport", "Transport"),
        ("package", "Package"),
        ("payment", "Payment"),
        ("refund", "Refund"),
        ("commission", "Commission"),
        ("other", "Other"),
    ]

    # Core identification
    reference_no = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        db_index=True,
        help_text="Booking or invoice number"
    )
    booking_no = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        db_index=True,
        help_text="Booking reference (auto from booking table)"
    )
    
    # Transaction classification
    transaction_type = models.CharField(
        max_length=50, 
        choices=TRANSACTION_TYPES,
        default="debit",
        help_text="debit or credit"
    )
    service_type = models.CharField(
        max_length=50, 
        choices=SERVICE_TYPES, 
        default="other",
        help_text="ticket / umrah / hotel / transport / package / payment / refund / commission"
    )
    
    # Description and notes
    narration = models.TextField(
        blank=True, 
        null=True, 
        help_text='Text summary (e.g., "Advance payment for Umrah Booking #SK1234")'
    )
    remarks = models.TextField(blank=True, null=True, help_text="Additional notes or reason")
    
    # NEW: Transaction amount
    transaction_amount = models.DecimalField(
        max_digits=18, 
        decimal_places=2, 
        default=Decimal("0.00"),
        help_text="Transaction amount (kitna ki transaction howi hai)"
    )
    
    # NEW: Final balance
    final_balance = models.DecimalField(
        max_digits=18, 
        decimal_places=2, 
        default=Decimal("0.00"),
        help_text="Auto-calc from (total paid - total due)"
    )
    
    # Relationships - Original booking info
    booking = models.ForeignKey(
        'booking.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ledger_entries',
        help_text="Related booking if applicable",
        db_constraint=False
    )
    
    # NEW: Seller organization (who created this booking)
    seller_organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sold_ledger_entries',
        help_text="Organization that created this booking",
        db_constraint=False
    )
    
    # NEW: Inventory owner organization
    inventory_owner_organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_ledger_entries',
        help_text="Owner org of that inventory item (auto detect from item)",
        db_constraint=False
    )
    
    # Organization hierarchy (kept for compatibility)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='ledger_entries',
        help_text="Organization owning this transaction",
        db_constraint=False
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ledger_entries',
        help_text="Branch if created under branch",
        db_constraint=False
    )
    agency = models.ForeignKey(
        Agency,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ledger_entries',
        help_text="Agency if created by an agent",
        db_constraint=False
    )
    
    # NEW: Area agency
    area_agency = models.ForeignKey(
        'area_leads.AreaLead',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ledger_entries',
        help_text="Area agency if booking linked with area agent",
        db_constraint=False
    )
    
    # NEW: Payment tracking
    payment_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="List of all linked payment record IDs"
    )
    
    # NEW: Booking details counts
    group_ticket_count = models.IntegerField(
        default=0,
        help_text="Total number of tickets if multiple in group booking"
    )
    umrah_visa_count = models.IntegerField(
        default=0,
        help_text="Total number of Umrah visas included"
    )
    hotel_nights_count = models.IntegerField(
        default=0,
        help_text="Total hotel nights for all hotels in booking"
    )
    
    # User tracking
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        help_text="User who initiated this transaction",
        db_constraint=False
    )
    
    # Timestamps
    creation_datetime = models.DateTimeField(
        default=timezone.now,
        help_text="Auto set (timezone aware)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata and audit
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Additional data: amounts, customer info, etc."
    )
    
    # NEW: Internal notes (formatted text array)
    internal_notes = models.JSONField(
        default=list, 
        blank=True,
        help_text='Array of timestamped notes like "[2025-10-17 11:24] Payment received via Bank Alfalah."'
    )
    
    # Reversal support (for cancellations/refunds)
    reversed = models.BooleanField(
        default=False,
        help_text="True if this entry has been reversed"
    )
    reversed_of = models.ForeignKey(
        "self", 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True, 
        related_name="reversals",
        help_text="Original entry that was reversed"
    )
    reversed_at = models.DateTimeField(null=True, blank=True)
    reversed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ledger_reversals',
        db_constraint=False
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Ledger Entry"
        verbose_name_plural = "Ledger Entries"
        indexes = [
            models.Index(fields=['reference_no', 'organization']),
            models.Index(fields=['booking_no', 'transaction_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"LE#{self.id} - {self.transaction_type} - {self.reference_no or self.booking_no or 'No Ref'}"
    
    @property
    def total_debit(self):
        """Calculate total debit from all lines"""
        return self.lines.aggregate(total=models.Sum('debit'))['total'] or Decimal('0.00')
    
    @property
    def total_credit(self):
        """Calculate total credit from all lines"""
        return self.lines.aggregate(total=models.Sum('credit'))['total'] or Decimal('0.00')
    
    def reverse(self, user=None, remarks=None):
        """
        Create a reversal entry for this ledger entry.
        Used for cancellations and refunds.
        """
        if self.reversed:
            return None  # Already reversed
        
        # Create reversal entry
        reversal = LedgerEntry.objects.create(
            reference_no=self.reference_no,
            booking_no=self.booking_no,
            transaction_type='refund',
            service_type=self.service_type,
            narration=f"REVERSAL: {self.narration}",
            remarks=remarks or f"Reversal of entry #{self.id}",
            booking=self.booking,
            organization=self.organization,
            branch=self.branch,
            agency=self.agency,
            created_by=user,
            metadata=self.metadata,
            reversed_of=self
        )
        
        # Create reverse ledger lines (swap debit/credit)
        for line in self.lines.all():
            LedgerLine.objects.create(
                ledger_entry=reversal,
                account=line.account,
                debit=line.credit,  # Reverse
                credit=line.debit,  # Reverse
                final_balance=line.account.balance
            )
            
            # Update account balance
            line.account.balance = line.account.balance - line.debit + line.credit
            line.account.save()
        
        # Mark original as reversed
        self.reversed = True
        self.reversed_at = timezone.now()
        self.reversed_by = user
        self.save()
        
        return reversal


class LedgerLine(models.Model):
    """
    Individual line in a ledger entry (double-entry bookkeeping).
    Each line represents a debit or credit to a specific account.
    """
    ledger_entry = models.ForeignKey(
        LedgerEntry, 
        on_delete=models.CASCADE, 
        related_name="lines"
    )
    account = models.ForeignKey(
        Account, 
        on_delete=models.CASCADE, 
        related_name="lines"
    )
    debit = models.DecimalField(
        max_digits=18, 
        decimal_places=2, 
        default=Decimal("0.00"),
        help_text="Amount debited (Asset/Expense increases)"
    )
    credit = models.DecimalField(
        max_digits=18, 
        decimal_places=2, 
        default=Decimal("0.00"),
        help_text="Amount credited (Liability/Income increases)"
    )
    balance_after = models.DecimalField(
        max_digits=18, 
        decimal_places=2, 
        default=Decimal("0.00"),
        help_text="Account balance after this transaction"
    )
    final_balance = models.DecimalField(
        max_digits=18, 
        decimal_places=2, 
        default=Decimal("0.00")
    )
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Ledger Line"
        verbose_name_plural = "Ledger Lines"

    def __str__(self):
        return f"Line {self.id}: {self.account} - D:{self.debit} C:{self.credit} -> Bal:{self.balance_after}"
