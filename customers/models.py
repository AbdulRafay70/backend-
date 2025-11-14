from django.db import models
from django.contrib.auth.models import User
from organization.models import Organization, Branch
from booking.models import Booking


class Customer(models.Model):
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    email = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    passport_number = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    source = models.CharField(max_length=50, null=True, blank=True)  # Booking / Lead / Area
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_customers_branch')
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_customers_org')
    service_type = models.CharField(max_length=50, null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.full_name} ({self.phone or self.email or self.id})"


class Lead(models.Model):
    STATUS_CHOICES = [
        ("new", "New"),
        ("followup", "Followup"),
        ("converted", "Converted"),
        ("lost", "Lost"),
    ]
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    email = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    passport_number = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    cnic = models.CharField(max_length=50, null=True, blank=True)
    source = models.CharField(max_length=50, null=True, blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_leads_org')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_leads_branch')
    interest = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_leads_created_by')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Lead {self.full_name} ({self.phone or self.email})"


class FollowUpHistory(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="followups")
    followup_date = models.DateTimeField()
    remarks = models.TextField(blank=True, null=True)
    contacted_via = models.CharField(max_length=50, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_followup_created_by')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"FollowUp for {self.lead_id} @ {self.followup_date.date()}"


class LoanCommitment(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="loan_commitments", null=True, blank=True)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_loancommitment_booking')
    promised_clear_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, default="pending")
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_loancommitment_created_by')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Loan {self.id} - status={self.status}"
