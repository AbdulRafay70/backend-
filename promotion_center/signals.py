from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from booking.models import Booking, Payment
from leads.models import Lead
from .models import PromotionContact, normalize_phone
from universal.models import UniversalRegistration


def upsert_contact_from_booking(booking: Booking):
    # prefer booking user or client name; fallbacks
    name = None
    phone = None
    email = None

    # try top-level booking contact_number
    try:
        if getattr(booking, "contact_number", None):
            phone = booking.contact_number
    except Exception:
        pass

    # check booking person details for contact numbers
    if not phone:
        try:
            for person in booking.person_details.all():
                if person.contact_number:
                    phone = person.contact_number
                    name = f"{person.first_name or ''} {person.last_name or ''}".strip() or name
                    break
        except Exception:
            pass

    # BookingPersonContactDetails (specific phone entries)
    if not phone:
        try:
            for person in booking.person_details.all():
                for cd in getattr(person, "contact_details", []).all() if hasattr(person, "contact_details") else []:
                    if getattr(cd, "phone_number", None):
                        phone = cd.phone_number
                        break
                if phone:
                    break
        except Exception:
            pass

    # fallback to booking user
    if hasattr(booking, "user") and booking.user and not name:
        try:
            fullname = booking.user.get_full_name() if hasattr(booking.user, "get_full_name") else None
            name = fullname or getattr(booking.user, "username", None)
        except Exception:
            name = getattr(booking.user, "username", None)

    # try booking.payment_details -> maybe payment has payer info in remarks or extra data
    if not phone:
        try:
            pay = booking.payment_details.first()
            if pay and getattr(pay, "remarks", None):
                # rudimentary extract: look for digits sequence in remarks
                import re
                m = re.search(r"(\+?\d[\d\s-]{6,})", pay.remarks or "")
                if m:
                    phone = m.group(1)
        except Exception:
            pass

    # finally try client_note or journal_items
    if not phone:
        try:
            if getattr(booking, "client_note", None):
                import re
                m = re.search(r"(\+?\d[\d\s-]{6,})", booking.client_note or "")
                if m:
                    phone = m.group(1)
        except Exception:
            pass

    # if we have no phone, do nothing
    if not phone:
        return

    phone = normalize_phone(phone)
    defaults = {
        "name": name or "",
        "email": email or None,
        "contact_type": "booking_contact",
        "source": "booking",
        "source_reference": f"Booking #{booking.id}",
        "organization_id": booking.organization_id,
        "branch_id": booking.branch_id,
        "last_seen": timezone.now(),
    }
    obj, created = PromotionContact.objects.update_or_create(phone=phone, defaults=defaults)
    # mark duplicate flag if there are others
    duplicates = PromotionContact.objects.filter(phone=phone).count()
    if duplicates > 1 and not obj.is_duplicate:
        obj.is_duplicate = True
        obj.save(update_fields=["is_duplicate"]) 


@receiver(post_save, sender=Booking)
def booking_post_save(sender, instance: Booking, created, **kwargs):
    # when booking is created or updated, attempt to upsert a promotion contact
    try:
        upsert_contact_from_booking(instance)
    except Exception:
        # signals must not crash
        pass


@receiver(post_save, sender=Lead)
def lead_post_save(sender, instance: Lead, created, **kwargs):
    # create or update contact from lead
    try:
        phone = instance.contact_number
        if not phone:
            return
        phone = normalize_phone(phone)
        defaults = {
            "name": instance.customer_full_name,
            "email": instance.email,
            "contact_type": "lead",
            "source": instance.lead_source or "lead",
            "source_reference": f"Lead #{instance.id}",
            "organization_id": instance.organization_id,
            "branch_id": instance.branch_id,
            "last_seen": timezone.now(),
        }
        obj, created = PromotionContact.objects.update_or_create(phone=phone, defaults=defaults)
        duplicates = PromotionContact.objects.filter(phone=phone).count()
        if duplicates > 1 and not obj.is_duplicate:
            obj.is_duplicate = True
            obj.save(update_fields=["is_duplicate"]) 
    except Exception:
        pass


@receiver(post_save, sender=UniversalRegistration)
def universal_registration_post_save(sender, instance: UniversalRegistration, created, **kwargs):
    """Upsert agents/branches/organizations into promotion contacts when registration occurs."""
    try:
        phone = instance.contact_no or instance.email
        if not phone and not instance.email:
            # nothing to upsert
            return
        # prefer contact_no as phone; fallback to email
        phone_val = instance.contact_no if instance.contact_no else None
        email_val = instance.email if instance.email else None
        name = instance.name
        ctype = "other"
        if instance.type == UniversalRegistration.TYPE_AGENT:
            ctype = "agent"
        elif instance.type == UniversalRegistration.TYPE_ORGANIZATION:
            ctype = "organization"
        elif instance.type == UniversalRegistration.TYPE_BRANCH:
            ctype = "agent"

        if phone_val:
            phone_val = normalize_phone(phone_val)
        defaults = {
            "name": name,
            "email": email_val,
            "contact_type": ctype,
            "source": "universal_register",
            "source_reference": f"UniversalRegistration:{instance.id}",
            "organization_id": int(instance.organization_id) if instance.organization_id else None,
            "branch_id": int(instance.branch_id) if instance.branch_id else None,
            "last_seen": timezone.now(),
        }
        if phone_val:
            obj, created = PromotionContact.objects.update_or_create(phone=phone_val, defaults=defaults)
        elif email_val:
            # fallback to email-based upsert
            obj_qs = PromotionContact.objects.filter(email__iexact=email_val)
            if obj_qs.exists():
                obj = obj_qs.first()
                for k, v in defaults.items():
                    setattr(obj, k, v)
                obj.save()
            else:
                # create with a generated phone placeholder to satisfy unique constraint (use email as phone)
                defaults["phone"] = email_val
                PromotionContact.objects.create(**defaults)
    except Exception:
        pass


@receiver(post_save, sender=Payment)
def payment_post_save(sender, instance: Payment, created, **kwargs):
    try:
        booking = instance.booking
        if booking:
            booking_post_save(Booking, booking, False)
    except Exception:
        pass
