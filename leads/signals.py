from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Booking
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
