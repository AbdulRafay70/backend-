import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from finance.models import FinancialRecord

def inspect():
    keep_refs = ['BK-497', 'BK-20260126-85B34D']
    keep_ids = [496, 497] 

    print("--- Current Bookings ---")
    all_bookings = Booking.objects.all()
    for b in all_bookings:
        print(f"ID: {b.id}, Rec: {b.booking_number}, Date: {b.date}")

    print("\n--- Bookings to KEEP ---")
    retrieved_keep = []
    for b in all_bookings:
        if b.booking_number in keep_refs or b.id in keep_ids:
             print(f"KEEP -> ID: {b.id}, Ref: {b.booking_number}")
             retrieved_keep.append(b.id)
    
    print(f"\nIDs to Keep: {retrieved_keep}")

    print("\n--- Bookings to DELETE ---")
    count = 0
    for b in all_bookings:
        if b.id not in retrieved_keep:
            print(f"DELETE -> ID: {b.id}, Ref: {b.booking_number}")
            count += 1
    print(f"Total to delete: {count}")

if __name__ == '__main__':
    inspect()
