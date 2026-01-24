"""
Check if inter-org ledger entries exist for booking BK-20260123-2253CB
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import LedgerEntry
from booking.models import Booking

booking_number = "BK-20260123-2253CB"

print(f"\n{'='*60}")
print(f"Checking Inter-Org Ledger Entries for {booking_number}")
print(f"{'='*60}\n")

try:
    booking = Booking.objects.get(booking_number=booking_number)
    print(f"✅ Booking found:")
    print(f"   - ID: {booking.id}")
    print(f"   - Organization: {booking.organization.name if booking.organization else 'N/A'} (ID: {booking.organization_id})")
    print(f"   - Status: {booking.status}")
    print(f"   - Total Amount: PKR {booking.total_amount}\n")
    
    # Check for ledger entries
    entries = LedgerEntry.objects.filter(booking_no=booking_number)
    print(f"📊 Total Ledger Entries: {entries.count()}\n")
    
    for i, entry in enumerate(entries, 1):
        print(f"Entry {i}:")
        print(f"   - ID: {entry.id}")
        print(f"   - Organization: {entry.organization.name} (ID: {entry.organization_id})")
        print(f"   - Transaction Type: {entry.transaction_type}")
        print(f"   - Service Type: {entry.service_type}")
        print(f"   - Amount: PKR {entry.transaction_amount}")
        print(f"   - Narration: {entry.narration}")
        
        if entry.seller_organization or entry.inventory_owner_organization:
            print(f"   🔹 INTER-ORG ENTRY:")
            if entry.seller_organization:
                print(f"      - Seller Org: {entry.seller_organization.name} (ID: {entry.seller_organization_id})")
            if entry.inventory_owner_organization:
                print(f"      - Owner Org: {entry.inventory_owner_organization.name} (ID: {entry.inventory_owner_organization_id})")
        
        # Show lines
        print(f"   - Lines:")
        for line in entry.lines.all():
            print(f"      • {line.account.name}: DR {line.debit}, CR {line.credit}")
        print()
    
    # Check hotels to see if there should be inter-org entries
    print(f"\n{'='*60}")
    print(f"Checking Hotel Details for Inter-Org Scenario")
    print(f"{'='*60}\n")
    
    for hotel_detail in booking.hotel_details.all():
        print(f"Hotel: {hotel_detail.hotel.name if hotel_detail.hotel else 'N/A'}")
        if hotel_detail.hotel and hotel_detail.hotel.organization:
            print(f"   - Hotel Org: {hotel_detail.hotel.organization.name} (ID: {hotel_detail.hotel.organization_id})")
            print(f"   - Booking Org: {booking.organization.name} (ID: {booking.organization_id})")
            if hotel_detail.hotel.organization_id != booking.organization_id:
                print(f"   ✅ This IS a reseller scenario! Should have inter-org entries.")
            else:
                print(f"   ℹ️ Same organization - not a reseller scenario")
        print()

except Booking.DoesNotExist:
    print(f"❌ Booking {booking_number} not found")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
