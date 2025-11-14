from django.db import models
from django.utils import timezone


class AreaLead(models.Model):
    SOURCE_CHOICES = [
        ("office_walkin", "office_walkin"),
        ("call", "call"),
        ("facebook", "facebook"),
        ("instagram", "instagram"),
        ("website", "website"),
        ("whatsapp", "whatsapp"),
        ("other", "other"),
    ]

    STATUS_CHOICES = [
        ("pending", "pending"),
        ("waiting_response", "waiting_response"),
        ("converted", "converted"),
        ("lost", "lost"),
    ]

    branch_id = models.CharField(max_length=50)
    organization_id = models.CharField(max_length=50, blank=True, null=True)
    customer_name = models.CharField(max_length=150)
    passport_number = models.CharField(max_length=50)
    contact_number = models.CharField(max_length=50)
    cnic = models.CharField(max_length=25, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default="office_walkin")
    lead_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True, null=True)
    created_by = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer_name} ({self.passport_number or self.contact_number})"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["branch_id", "passport_number"], name="unique_branch_passport")
        ]


class LeadFollowUp(models.Model):
    STATUS_CHOICES = [
        ("waiting_response", "waiting_response"),
        ("contacted", "contacted"),
        ("lost", "lost"),
    ]

    lead = models.ForeignKey(AreaLead, on_delete=models.CASCADE, related_name="followups")
    next_followup_date = models.DateField()
    next_followup_time = models.TimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    followup_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="waiting_response")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"FollowUp {self.lead_id} on {self.next_followup_date}"


class LeadConversation(models.Model):
    MESSAGE_TYPES = [
        ("call", "call"),
        ("whatsapp", "whatsapp"),
        ("meeting", "meeting"),
        ("note", "note"),
    ]

    lead = models.ForeignKey(AreaLead, on_delete=models.CASCADE, related_name="conversations")
    message_type = models.CharField(max_length=30, choices=MESSAGE_TYPES)
    summary = models.TextField()
    recorded_by = models.CharField(max_length=50)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Conversation {self.lead_id} @ {self.timestamp}"


class LeadPaymentPromise(models.Model):
    STATUS_CHOICES = [
        ("pending", "pending"),
        ("cleared", "cleared"),
        ("overdue", "overdue"),
    ]

    lead = models.ForeignKey(AreaLead, on_delete=models.CASCADE, related_name="payment_promises")
    booking_id = models.CharField(max_length=50, blank=True, null=True)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    customer_promise = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def mark_overdue_if_needed(self):
        if self.status == "pending" and self.due_date < timezone.now().date():
            self.status = "overdue"
            self.save()

    def __str__(self):
        return f"Promise {self.lead_id} due {self.due_date} ({self.status})"
