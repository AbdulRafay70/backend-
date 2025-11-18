from django.core.management.base import BaseCommand
from django.utils import timezone

from booking.models import Booking


class Command(BaseCommand):
    help = 'Expire pending bookings whose expiry_time has passed and restore seats.'

    def handle(self, *args, **options):
        now = timezone.now()
        qs = Booking.objects.filter(status__in=['pending', 'unpaid'], expiry_time__lt=now)
        total = qs.count()
        self.stdout.write(f'Found {total} bookings to expire')
        for b in qs:
            b.status = 'expired'
            b.save()
            self.stdout.write(f'Expired booking {b.id}')
        self.stdout.write('Done')
