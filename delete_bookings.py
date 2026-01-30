import os
import django
import sys

# Setup Django environment (using correct settings now)
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from finance.models import FinancialRecord
from django.db import transaction

def delete_bookings():
    keep_ids = [496, 497]
    
    print("--- Starting Cleanup ---")
    
    with transaction.atomic():
        # Get bookings to delete
        bookings_to_delete = Booking.objects.exclude(id__in=keep_ids)
        delete_ids = list(bookings_to_delete.values_list('id', flat=True))
        
        count = bookings_to_delete.count()
        print(f"Found {count} bookings to delete.")
        
        # Delete Financial Records linked to these bookings
        # Note: FinancialRecord.booking_id is an IntegerField, not FK.
        fin_records = FinancialRecord.objects.filter(booking_id__in=delete_ids)
        fin_count = fin_records.count()
        fin_records.delete()
        print(f"Deleted {fin_count} FinancialRecord entries linked to deleted bookings.")
        
        # Delete Bookings (Cascades to linked items usually, if FKs exist)
        bookings_to_delete.delete()
        print(f"Deleted {count} Bookings.")
        
        # Verify
        remaining = Booking.objects.all().count()
        print(f"Remaining Bookings: {remaining} (Should be 2)")
        
        remaining_fin = FinancialRecord.objects.filter(booking_id__isnull=False).count()
        print(f"Remaining Linked Financial Records: {remaining_fin}")

if __name__ == '__main__':
    delete_bookings()
