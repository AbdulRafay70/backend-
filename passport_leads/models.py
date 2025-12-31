from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class PassportLead(models.Model):
    FOLLOWUP_CHOICES = [('pending', 'Pending'), ('completed', 'Completed'), ('converted', 'Converted')]

    branch_id = models.IntegerField(db_index=True)
    organization_id = models.IntegerField(db_index=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='passport_leads', db_constraint=False)
    lead_source = models.CharField(max_length=100, blank=True, null=True)
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=30, db_index=True)
    cnic = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    passport_number = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    followup_status = models.CharField(max_length=20, choices=FOLLOWUP_CHOICES, default='pending')
    next_followup_date = models.DateField(blank=True, null=True, db_index=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    assigned_to_name = models.CharField(max_length=150, blank=True, null=True)
    pending_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'passport_lead'
        indexes = [
            models.Index(fields=['customer_phone']),
            models.Index(fields=['passport_number']),
            models.Index(fields=['cnic']),
            models.Index(fields=['branch_id']),
            models.Index(fields=['next_followup_date']),
        ]

    def __str__(self):
        return f"Lead {self.id} - {self.customer_name} ({self.customer_phone})"


class PaxProfile(models.Model):
    lead = models.ForeignKey(PassportLead, on_delete=models.SET_NULL, null=True, blank=True, related_name='pax', db_constraint=False)
    # Name fields
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    nickname = models.CharField(max_length=50, blank=True, null=True)
    
    # Passport details
    passport_number = models.CharField(max_length=50, db_index=True)
    date_of_birth = models.DateField(blank=True, null=True)
    date_of_issue = models.DateField(blank=True, null=True)
    date_of_expiry = models.DateField(blank=True, null=True)
    issuing_country = models.CharField(max_length=100, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    
    # Contact information
    address = models.TextField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    whatsapp_number = models.CharField(max_length=30, blank=True, null=True)
    
    # Legacy fields (kept for backward compatibility)
    age = models.PositiveIntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pax_profile'
        indexes = [
            models.Index(fields=['passport_number']),
            models.Index(fields=['date_of_expiry']),
        ]

    def __str__(self):
        return f"PAX {self.id} - {self.first_name} {self.last_name} ({self.passport_number})"


class FollowUpLog(models.Model):
    lead = models.ForeignKey(PassportLead, on_delete=models.CASCADE, related_name='followups', db_constraint=False)
    remark_text = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'followup_log'

    def __str__(self):
        return f"FollowUp {self.id} for Lead {self.lead_id} at {self.created_at}"
