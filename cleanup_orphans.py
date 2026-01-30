import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from finance.models import FinancialRecord
from django.db import transaction

def cleanup_orphans():
    keep_ids = [496, 497]
    
    print("--- Starting Orphan Cleanup ---")
    
    with transaction.atomic():
        # Find records linked to bookings that are NOT in the keep list
        # This includes valid bookings we just deleted (already handled, but safe to re-check)
        # And orphaned records pointing to old/non-existent bookings
        orphans = FinancialRecord.objects.exclude(booking_id__isnull=True).exclude(booking_id__in=keep_ids)
        
        count = orphans.count()
        if count > 0:
            print(f"Found {count} orphan financial records (linked to bookings other than 496/497).")
            orphans.delete()
            print("Deleted orphans.")
        else:
            print("No orphans found.")
            
        remaining = FinancialRecord.objects.exclude(booking_id__isnull=True).count()
        print(f"Remaining Booking-linked Financial Records: {remaining}")
        
        # Verify specific IDs
        for bid in keep_ids:
            c = FinancialRecord.objects.filter(booking_id=bid).count()
            print(f"Records for Booking {bid}: {c}")

if __name__ == '__main__':
    cleanup_orphans()
