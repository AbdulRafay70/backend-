"""
Check why inter-org entries weren't created for BK-20260123-DE88AA
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from ledger.models import LedgerEntry

booking_number = "BK-20260123-DE88AA"

print(f"\n{'='*80}")
print(f"Checking Booking {booking_number}")
print(f"{'='*80}\n")

booking = Booking.objects.get(booking_number=booking_number)

print(f"Booking Type: {booking.booking_type}")
print(f"Booking Org: {booking.organization.name} (ID: {booking.organization_id})")
print(f"Status: {booking.status}")
print(f"Total Amount: PKR {booking.total_amount}\n")

# Check if it's a package
if booking.umrah_package:
    print(f"✅ This is a package booking: Package ID {booking.umrah_package_id}")
    package = booking.umrah_package
    print(f"   Package Name: {package.package_name}")
    print(f"   Package Org: {package.organization.name if package.organization else 'NOT SET'} (ID: {package.organization_id if package.organization else 'NULL'})")
    print()

# Check hotels
print("Hotel Details:")
for i, hotel_detail in enumerate(booking.hotel_details.all(), 1):
    print(f"\n  Hotel {i}: {hotel_detail.hotel.name if hotel_detail.hotel else 'N/A'}")
    print(f"    Hotel ID: {hotel_detail.hotel_id}")
    if hotel_detail.hotel:
        print(f"    Hotel Org: {hotel_detail.hotel.organization.name if hotel_detail.hotel.organization else 'NOT SET'}")
        print(f"    Hotel Org ID: {hotel_detail.hotel.organization_id if hotel_detail.hotel.organization else 'NULL'}")
    print(f"    inventory_owner_organization_id: {hotel_detail.inventory_owner_organization_id}")
    print(f"    booking_organization_id: {hotel_detail.booking_organization_id}")

# Check ledger entries
print(f"\n{'='*80}")
print(f"Ledger Entries for {booking_number}")
print(f"{'='*80}\n")

entries = LedgerEntry.objects.filter(booking_no=booking_number)
print(f"Total Entries: {entries.count()}\n")

for entry in entries:
    print(f"Entry ID {entry.id}:")
    print(f"  Organization: {entry.organization.name} (ID: {entry.organization_id})")
    print(f"  Narration: {entry.narration}")
    print(f"  Seller Org: {entry.seller_organization_id}")
    print(f"  Owner Org: {entry.inventory_owner_organization_id}")
    print()

print("\n" + "="*80)
print("DIAGNOSIS:")
print("="*80)
print("The inter-org code looks for hotel_detail.hotel.organization")
print("If the hotel doesn't have organization set, inter-org entries won't be created.")
print("\nFor PACKAGE bookings, we should check the PACKAGE organization instead!")
