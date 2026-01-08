from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from booking.models import Booking
from packages.models import BookingExpiry


class Command(BaseCommand):
    help = 'Force update ALL pending/unpaid bookings expiry_time'

    def handle(self, *args, **options):
        # Get all pending/unpaid bookings
        bookings = Booking.objects.filter(
            status__in=['pending', 'unpaid']
        )

        updated_count = 0

        for booking in bookings:
            if not booking.organization_id or not booking.created_at:
                continue

            try:
                # Get booking expiry settings
                expiry_settings = BookingExpiry.objects.filter(
                    organization_id=booking.organization_id
                ).first()

                if not expiry_settings:
                    continue

                # Determine expiry minutes
                expiry_minutes = 0
                booking_type = str(booking.booking_type or '').strip()

                if booking_type == 'Group Ticket':
                    expiry_minutes = expiry_settings.ticket_expiry_time or 0
                elif booking_type == 'Umrah Package':
                    expiry_minutes = expiry_settings.umrah_expiry_time or 0
                elif booking_type == 'Custom Package':
                    expiry_minutes = expiry_settings.custom_umrah_expiry_time or 0
                elif booking.is_public_booking:
                    expiry_minutes = expiry_settings.customer_expiry_time or 0
                else:
                    expiry_minutes = expiry_settings.ticket_expiry_time or 0

                if expiry_minutes <= 0:
                    continue

                # Calculate and update expiry_time
                new_expiry_time = booking.created_at + timedelta(minutes=expiry_minutes)
                Booking.objects.filter(pk=booking.pk).update(expiry_time=new_expiry_time)

                updated_count += 1
                self.stdout.write(f'✅ {booking.booking_number}: {expiry_minutes}min')

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ {booking.booking_number}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'\n✅ Updated {updated_count} bookings'))
