"""
Regenerate inter-org ledger entries for BK-20260123-2253CB with proper balance calculation
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import LedgerEntry

booking_number = "BK-20260123-2253CB"

print(f"\n{'='*70}")
print(f"Deleting old inter-org entries for {booking_number}")
print(f"{'='*70}\n")

# Delete the old inter-org entries (IDs 129 and 130)
old_entries = LedgerEntry.objects.filter(
    booking_no=booking_number,
    id__in=[129, 130]
)

for entry in old_entries:
    print(f"Deleting Entry ID {entry.id}: {entry.narration}")
    entry.delete()

print(f"\nDeleted {old_entries.count()} old inter-org entries\n")

# Now recreate them with the updated function
from decimal import Decimal
from booking.models import Booking
from ledger.utils import create_interorg_ledger_entries

booking = Booking.objects.get(booking_number=booking_number)

for hotel_detail in booking.hotel_details.all():
    if hotel_detail.hotel and hotel_detail.hotel.organization:
        hotel_owner_org = hotel_detail.hotel.organization
        booking_org = booking.organization
        
        if hotel_owner_org.id != booking_org.id:
            hotel_amount = Decimal(str(
                hotel_detail.total_in_pkr or 
                hotel_detail.total_price or 
                0
            ))
            
            if hotel_amount > 0:
                print(f"Creating new inter-org entries with proper balances...\n")
                
                reseller_entry, owner_entry = create_interorg_ledger_entries(
                    booking=booking,
                    reseller_org_id=booking_org.id,
                    owner_org_id=hotel_owner_org.id,
                    amount=hotel_amount,
                    service_type='hotel'
                )
                
                print(f"✅ New entries created!\n")
                print(f"Reseller Entry (Org {booking_org.id}) ID: {reseller_entry.id}")
                for line in reseller_entry.lines.all():
                    print(f"  - {line.account.name}: DR {line.debit}, CR {line.credit}, Balance: {line.balance_after}")
                
                print(f"\nOwner Entry (Org {hotel_owner_org.id}) ID: {owner_entry.id}")
                for line in owner_entry.lines.all():
                    print(f"  - {line.account.name}: DR {line.debit}, CR {line.credit}, Balance: {line.balance_after}")

print(f"\n{'='*70}\n")
