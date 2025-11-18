from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from booking.models import Booking

class Command(BaseCommand):
    help = "Release seats and mark public bookings as expired when expiry_time has passed and payment is not completed."

    def handle(self, *args, **options):
        now = timezone.now()
        qs = Booking.objects.filter(is_public_booking=True, status__in=['unpaid', 'pending'], expiry_time__isnull=False, expiry_time__lt=now)
        total = qs.count()
        self.stdout.write(f"Found {total} expired public bookings to process")

        for b in qs.select_related('umrah_package'):
            try:
                with transaction.atomic():
                    # mark expired
                    b.status = 'expired'
                    b.save(update_fields=['status'])

                    # release package seats if applicable
                    pkg = getattr(b, 'umrah_package', None)
                    if pkg:
                        try:
                            pkg.left_seats = (pkg.left_seats or 0) + (b.total_pax or 0)
                            pkg.booked_seats = max(0, (pkg.booked_seats or 0) - (b.total_pax or 0))
                            pkg.save(update_fields=['left_seats', 'booked_seats'])
                        except Exception:
                            pass

                    # best-effort notify
                    try:
                        from notifications import services as _ns
                        _ns.enqueue_booking_expired(b.id)
                    except Exception:
                        pass

                    self.stdout.write(f"Expired booking {b.booking_number} (id={b.id})")
            except Exception as e:
                self.stderr.write(f"Failed to process booking {b.id}: {e}")

        self.stdout.write("Done")
