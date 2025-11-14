from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Booking, BookingPersonDetail
from .models import PaxMovement


@receiver(post_save, sender=Booking)
def create_pax_movements_for_booking(sender, instance, created, **kwargs):
    """
    Auto-generate PaxMovement records when a booking is created or when it becomes paid.
    This creates movement tracking for each passenger in the booking.
    """
    # Only create movements if booking is paid and movements don't already exist
    if instance.payment_status == 'paid':
        # Get all passengers in this booking
        persons = instance.person_details.all()
        
        for person in persons:
            # Check if movement already exists for this person
            if not PaxMovement.objects.filter(booking=instance, person=person).exists():
                PaxMovement.objects.create(
                    booking=instance,
                    person=person,
                    status='in_pakistan'
                )


@receiver(post_save, sender=BookingPersonDetail)
def create_pax_movement_for_new_person(sender, instance, created, **kwargs):
    """
    Auto-generate PaxMovement when a new person is added to a paid booking.
    """
    if created and instance.booking.payment_status == 'paid':
        if not PaxMovement.objects.filter(booking=instance.booking, person=instance).exists():
            PaxMovement.objects.create(
                booking=instance.booking,
                person=instance,
                status='in_pakistan'
            )
