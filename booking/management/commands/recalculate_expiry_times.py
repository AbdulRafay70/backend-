from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from booking.models import Booking
from packages.models import BookingExpiry


class Command(BaseCommand):
    help = 'Recalculate expiry_time for all pending/unpaid bookings based on current BookingExpiry settings'

    def handle(self, *args, **options):
        # Get all pending/unpaid bookings
        bookings = Booking.objects.filter(
            status__in=['pending', 'unpaid']
        ).select_related('organization')

        updated_count = 0
        skipped_count = 0

        for booking in bookings:
            if not booking.organization_id:
                skipped_count += 1
                continue

            try:
                # Get booking expiry settings for this organization
                expiry_settings = BookingExpiry.objects.filter(
                    organization_id=booking.organization_id
                ).first()

                if not expiry_settings:
                    self.stdout.write(
                        self.style.WARNING(
                            f'No expiry settings for org {booking.organization_id}, skipping booking {booking.booking_number}'
                        )
                    )
                    skipped_count += 1
                    continue

                # Determine which expiry time to use based on booking_type
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
                    # Default fallback
                    expiry_minutes = expiry_settings.ticket_expiry_time or 0

                if expiry_minutes <= 0:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Expiry time is 0 for booking {booking.booking_number}, skipping'
                        )
                    )
                    skipped_count += 1
                    continue

                # Calculate new expiry_time from created_at
                new_expiry_time = booking.created_at + timedelta(minutes=expiry_minutes)

                # Update the booking
                booking.expiry_time = new_expiry_time
                booking.save(update_fields=['expiry_time'])

                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Updated booking {booking.booking_number}: {expiry_minutes} minutes from {booking.created_at}'
                    )
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'❌ Error updating booking {booking.booking_number}: {e}'
                    )
                )
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Done! Updated {updated_count} bookings, skipped {skipped_count}'
            )
        )
