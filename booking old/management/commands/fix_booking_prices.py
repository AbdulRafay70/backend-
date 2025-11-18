"""
Management command to fix booking item prices by re-saving them to trigger auto-fill
"""
from django.core.management.base import BaseCommand
from booking.models import BookingItem
from decimal import Decimal


class Command(BaseCommand):
    help = 'Fix booking item prices by auto-filling from inventory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--booking',
            type=str,
            help='Specific booking number to fix (e.g., BK-20251101-0884)',
        )

    def handle(self, *args, **options):
        booking_number = options.get('booking')
        
        if booking_number:
            items = BookingItem.objects.filter(booking__booking_number=booking_number)
            self.stdout.write(f'Fixing prices for booking: {booking_number}')
        else:
            # Fix all booking items with zero price
            items = BookingItem.objects.filter(unit_price=0)
            self.stdout.write(f'Fixing all booking items with zero prices...')
        
        count = 0
        for item in items:
            old_price = item.unit_price
            
            # Force re-save to trigger auto-fill
            item.save()
            item.refresh_from_db()
            
            if item.unit_price != old_price:
                count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {item.item_name}: {old_price} → {item.unit_price}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'- {item.item_name}: No price available in inventory'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Fixed {count} booking items')
        )
