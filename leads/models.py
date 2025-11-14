from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from organization.models import Organization, Branch


class Lead(models.Model):
    LEAD_SOURCES = [
        ("walk-in", "walk-in"),
        ("call", "call"),
        ("whatsapp", "whatsapp"),
        ("facebook", "facebook"),
        ("referral", "referral"),
    ]

    LEAD_STATUS = [
        ("new", "new"),
        ("followup", "followup"),
        ("confirmed", "confirmed"),
        ("lost", "lost"),
    ]

    INTERESTED_IN = [
        ("ticket", "ticket"),
        ("umrah", "umrah"),
        ("visa", "visa"),
        ("transport", "transport"),
        ("hotel", "hotel"),
    ]

    LOAN_STATUS = [
        ("pending", "pending"),
        ("cleared", "cleared"),
        ("overdue", "overdue"),
    ]

    CONVERSION_STATUS = [
        ("not_converted", "not_converted"),
        ("converted_to_booking", "converted_to_booking"),
        ("lost", "lost"),
    ]

    customer_full_name = models.CharField(max_length=255)
    passport_number = models.CharField(max_length=50, blank=True, null=True)
    passport_expiry = models.DateField(blank=True, null=True)
    contact_number = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    cnic_number = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="leads")
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="leads")
    lead_source = models.CharField(max_length=30, choices=LEAD_SOURCES, default="walk-in")
    lead_status = models.CharField(max_length=30, choices=LEAD_STATUS, default="new")
    interested_in = models.CharField(max_length=30, choices=INTERESTED_IN, blank=True, null=True)
    interested_travel_date = models.DateField(blank=True, null=True)
    next_followup_date = models.DateField(blank=True, null=True)
    next_followup_time = models.TimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    loan_promise_date = models.DateField(blank=True, null=True)
    loan_status = models.CharField(max_length=20, choices=LOAN_STATUS, default="pending")
    last_contacted_date = models.DateField(blank=True, null=True)
    conversion_status = models.CharField(max_length=30, choices=CONVERSION_STATUS, default="not_converted")
    # Use db_constraint=False to avoid strict DB-level FK errors during migrations when booking table
    # may not be present at the exact time migrations run in some environments.
    booking = models.ForeignKey(
        "booking.Booking",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="lead",
        db_constraint=False,
    )
    # organization may not define a PEX model in all deployments; store pex id instead
    pex_id = models.IntegerField(blank=True, null=True)
    created_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["passport_number"]), models.Index(fields=["contact_number"]) ]

    def save(self, *args, **kwargs):
        if self.last_contacted_date is None and self.next_followup_date is None:
            # keep as is
            pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Lead {self.customer_full_name} ({self.passport_number or self.contact_number})"


class FollowUpHistory(models.Model):
    CONTACTED_VIA = [
        ("call", "call"),
        ("whatsapp", "whatsapp"),
        ("in-person", "in-person"),
    ]

    FOLLOWUP_RESULT = [
        ("pending", "pending"),
        ("confirmed", "confirmed"),
        ("lost", "lost"),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="followups")
    followup_date = models.DateField()
    followup_time = models.TimeField(blank=True, null=True)
    contacted_via = models.CharField(max_length=20, choices=CONTACTED_VIA)
    remarks = models.TextField(blank=True, null=True)
    next_followup_date = models.DateField(blank=True, null=True)
    followup_result = models.CharField(max_length=20, choices=FOLLOWUP_RESULT, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return f"FollowUp for {self.lead} on {self.followup_date}"


class LoanCommitment(models.Model):
    STATUS = [
        ("pending", "pending"),
        ("cleared", "cleared"),
        ("overdue", "overdue"),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="loan_commitments")
    booking = models.ForeignKey("booking.Booking", on_delete=models.SET_NULL, blank=True, null=True, db_constraint=False)
    promised_clear_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def mark_overdue_if_needed(self):
        if self.status == "pending" and self.promised_clear_date < timezone.now().date():
            self.status = "overdue"
            self.save()

    def __str__(self):
        return f"LoanCommitment for {self.lead} - {self.promised_clear_date} ({self.status})"


class FollowUp(models.Model):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("pending", "Pending"),
        ("closed", "Closed"),
    ]

    booking = models.ForeignKey(
        'booking.Booking', on_delete=models.CASCADE, related_name='followups'
    )
    lead = models.ForeignKey(
        Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='lead_followups'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='open')
    notes = models.TextField(blank=True, null=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        indexes = [models.Index(fields=['status']), models.Index(fields=['due_date'])]

    def close(self, user=None):
        # enforce remaining_amount == 0
        if float(self.remaining_amount or 0) != 0:
            raise ValueError("Cannot close follow-up unless remaining_amount == 0")
        self.status = 'closed'
        self.closed_at = timezone.now()
        if user and hasattr(self, 'closed_by'):
            try:
                self.closed_by = user
            except Exception:
                pass
        self.save()

    def reopen(self):
        if self.status == 'closed':
            self.status = 'open'
            self.closed_at = None
            self.save()
