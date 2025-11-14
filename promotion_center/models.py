from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator, validate_email
from django.contrib.auth import get_user_model

from organization.models import Organization, Branch

User = get_user_model()


PHONE_RE = r"^\+?[0-9\-\s]{7,20}$"


def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    # keep digits and leading +
    phone = phone.strip()
    normalized = "+" + "".join([c for c in phone if c.isdigit()]) if phone.startswith("+") else "".join([c for c in phone if c.isdigit()])
    return normalized


class PromotionContact(models.Model):
    CONTACT_TYPES = [
        ("lead", "Lead"),
        ("customer", "Customer"),
        ("agent", "Agent"),
        ("walkin", "Walk-in"),
        ("booking_contact", "Booking Contact"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=32, unique=True)
    email = models.EmailField(blank=True, null=True)
    contact_type = models.CharField(max_length=30, choices=CONTACT_TYPES, default="other")
    source = models.CharField(max_length=255, blank=True, null=True)
    source_reference = models.CharField(max_length=255, blank=True, null=True)
    # store numeric organization/branch ids to avoid DB FK constraints in diverse deployments
    organization_id = models.IntegerField(blank=True, null=True)
    branch_id = models.IntegerField(blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    # Freeform notes for marketing or admin annotations
    notes = models.TextField(blank=True, null=True)
    is_duplicate = models.BooleanField(default=False)
    is_subscribed = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    # contact status (active/inactive)
    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
    ]
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    last_seen = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["phone"]),
            models.Index(fields=["organization_id"]),
            models.Index(fields=["email"]),
            models.Index(fields=["contact_type"]),
        ]

    def save(self, *args, **kwargs):
        # Normalize phone before saving
        if self.phone:
            self.phone = normalize_phone(self.phone)
        # basic email validation
        if self.email:
            try:
                validate_email(self.email)
            except Exception:
                # keep original value but don't crash
                pass
        if not self.last_seen:
            self.last_seen = timezone.now()
        super().save(*args, **kwargs)

    def mark_seen(self, when=None):
        self.last_seen = when or timezone.now()
        self.save(update_fields=["last_seen"])

    def __str__(self):
        return f"{self.name or '—'} ({self.phone})"
