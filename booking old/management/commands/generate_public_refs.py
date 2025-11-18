from django.core.management.base import BaseCommand
from booking.models import Booking
from django.conf import settings

class Command(BaseCommand):
    help = 'Generate public_ref for bookings missing it, and optionally print QR link.'

    def add_arguments(self, parser):
        parser.add_argument('--regenerate', action='store_true', help='Regenerate public_ref for all bookings')
        parser.add_argument('--limit', type=int, default=0, help='Limit number of bookings to process (0 = all)')
        parser.add_argument('--print-qr', action='store_true', help='Print QR link for each booking')
        parser.add_argument('--base-url', type=str, default=None, help='Base URL to use for QR links (overrides settings)')

    def handle(self, *args, **options):
        regen = options.get('regenerate')
        limit = options.get('limit') or 0
        print_qr = options.get('print_qr')
        base_url = options.get('base_url') or getattr(settings, 'PUBLIC_BOOKING_BASE_URL', None) or 'https://saer.pk/order-status/'

        qs = Booking.objects.all().order_by('id')
        if not regen:
            qs = qs.filter(public_ref__isnull=True)
        if limit > 0:
            qs = qs[:limit]

        total = qs.count()
        self.stdout.write(self.style.NOTICE(f'Processing {total} bookings'))
        updated = 0
        for b in qs:
            try:
                if regen or not b.public_ref:
                    b.generate_public_ref()
                    b.save(update_fields=['public_ref'])
                    updated += 1
                if print_qr:
                    url = f"{base_url}?ref={b.public_ref}"
                    self.stdout.write(f"Booking {b.booking_number}: {b.public_ref} -> {url}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed booking id={b.id}: {e}"))
        self.stdout.write(self.style.SUCCESS(f'Updated {updated} bookings.'))
