from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Booking
from .models import Customer, Lead
from .utils import upsert_customer_from_data


@receiver(post_save, sender=Booking)
def booking_create_or_update_customer(sender, instance, created, **kwargs):
    """When a Booking is created/updated, upsert a Customer record based on primary passenger/contact."""
    try:
        person = instance.person_details.first()
    except Exception:
        person = None

    if not person:
        return

    full_name = " ".join(filter(None, [person.first_name, person.last_name])).strip() or None
    phone = person.contact_number or None
    email = None
    passport_number = person.passport_number or None

    if not (phone or email or full_name or passport_number):
        return

    upsert_customer_from_data(
        full_name=full_name or (instance.user.username if instance.user else ""),
        phone=phone,
        email=email,
        passport_number=passport_number,
        branch=instance.branch,
        organization=instance.organization,
        source="Booking",
        last_activity=instance.date,
    )


@receiver(post_save, sender=Lead)
def lead_create_or_update_customer(sender, instance, created, **kwargs):
    """When a Lead (customers.Lead) is created/updated, upsert a Customer record."""
    upsert_customer_from_data(
        full_name=getattr(instance, "full_name", None),
        phone=getattr(instance, "phone", None),
        email=getattr(instance, "email", None),
        passport_number=getattr(instance, "passport_number", None),
        branch=getattr(instance, "branch", None),
        organization=getattr(instance, "organization", None),
        source="Lead",
        last_activity=getattr(instance, "created_at", None),
    )


# Optional: If there's a separate 'leads' app (created by teammate), attempt to attach a receiver
try:
    # import here to avoid import-time dependency if app not installed
    from leads.models import Lead as ExternalLead  # type: ignore

    @receiver(post_save, sender=ExternalLead)
    def external_lead_upsert_customer(sender, instance, created, **kwargs):
        """If a separate 'leads' app is present, use its Lead model to upsert Customers."""
        upsert_customer_from_data(
            full_name=getattr(instance, "full_name", None),
            phone=getattr(instance, "phone", None),
            email=getattr(instance, "email", None),
            passport_number=getattr(instance, "passport_number", None),
            branch=getattr(instance, "branch", None),
            organization=getattr(instance, "organization", None),
            source="LeadsApp",
            last_activity=getattr(instance, "created_at", None),
        )
except Exception:
    # leads app not present or import failed — skip optional connector
    pass
