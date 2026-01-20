from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Booking
from .models import Lead
from customers.models import Customer
from .services import LeadService
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Booking)
def auto_create_lead_from_booking(sender, instance, created, **kwargs):
    # Only auto-create when booking created
    if created:
        try:
            LeadService.auto_create_from_booking(instance)
        except Exception as e:
            # log exception but do not raise to avoid breaking booking save
            logger.exception(f"Auto lead creation failed for booking {getattr(instance, 'id', None)}: {e}")


@receiver(post_save, sender=Lead)
def create_customer_from_lead(sender, instance, created, **kwargs):
    """
    Automatically create or update a Customer record when a Lead is created/updated.
    This ensures leads appear in the Customer Database.
    """
    if not instance.customer_full_name and not instance.contact_number and not instance.email:
        # Skip if no customer data
        return
    
    # Try to find existing customer by phone or email
    customer = None
    if instance.contact_number:
        customer = Customer.objects.filter(phone=instance.contact_number).first()
    elif instance.email:
        customer = Customer.objects.filter(email=instance.email).first()
    
    # Prepare customer data
    customer_data = {
        'full_name': instance.customer_full_name or 'Unknown',
        'phone': instance.contact_number,
        'email': instance.email,
        'passport_number': instance.passport_number,
        'source': 'LeadsApp',
        'branch': instance.branch,
        'organization': instance.organization,
        'service_type': instance.interested_in or 'General',
        'is_active': True,
    }
    
    if customer:
        # Update existing customer
        for key, value in customer_data.items():
            if value:  # Only update non-empty values
                setattr(customer, key, value)
        customer.save()
    else:
        # Create new customer
        Customer.objects.create(**customer_data)
