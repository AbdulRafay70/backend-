import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from packages.models import UmrahPackage
from finance.utils import calculate_booking_pnl
from decimal import Decimal

def inspect_booking(booking_id):
    try:
        booking = Booking.objects.get(id=booking_id)
        print(f"--- BOOKING {booking_id} ---")
        print(f"Reference: {booking.booking_number}")
        print(f"Total Amount (Selling): {booking.total_amount}")
        print(f"Total in PKR: {booking.total_in_pkr}")
        print(f"Linked Package ID: {booking.umrah_package_id}")
        
        pkg = booking.umrah_package
        if pkg:
            print(f"\n--- PACKAGE {pkg.id} ({pkg.title}) ---")
            for room in ['sharing', 'double', 'triple', 'quad', 'quint']: # quint/quaint spelling check
                 s = getattr(pkg, f"{room}_selling_price", 0)
                 p = getattr(pkg, f"{room}_purchase_price", 0)
                 print(f"Room {room}: Selling={s}, Purchase={p}")
            
            print(f"Child w/o Bed: Selling={pkg.child_without_bed_selling_price}, Purchase={pkg.child_without_bed_purchase_price}")
            print(f"Infant: Selling={pkg.infant_package_selling_price}, Purchase={pkg.infant_package_purchase_price}")
            
        print("\n--- PAX DETAILS ---")
        person_details = booking.person_details.all()
        for person in person_details:
            print(f"Person: {person.first_name} {person.last_name}, Age Group: {person.age_group}")

        print("\n--- PNL CALCULATION ---")
        result = calculate_booking_pnl(booking_id)
        print(f"Result: {result}")
        
    except Booking.DoesNotExist:
        print(f"Booking {booking_id} not found")

if __name__ == "__main__":
    inspect_booking(496)
