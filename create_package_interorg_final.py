"""
Create inter-org entries for package booking BK-20260123-DE88AA
Package 71 belongs to Org 11, booked by Org 44
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from decimal import Decimal
from booking.models import Booking
from ledger.utils import create_interorg_ledger_entries

booking_number = "BK-20260123-DE88AA"

print(f"\n{'='*70}")
print(f"Creating inter-org entries for {booking_number}")
print(f"{'='*70}\n")

booking = Booking.objects.get(booking_number=booking_number)

print(f"Booking: {booking.booking_number}")
print(f"Type: {booking.booking_type}")
print(f"Booking Org: {booking.organization.name} (ID: {booking.organization_id})")
print(f"Package Owner Org: ID 11 (test)")
print(f"Total Amount: PKR {booking.total_amount}\n")

print(f"📦 Creating inter-org ledger entries for package reselling...\n")

reseller_entry, owner_entry = create_interorg_ledger_entries(
    booking=booking,
    reseller_org_id=44,  # Org 44 (aqib noonar)
    owner_org_id=11,     # Org 11 (test)
    amount=Decimal(str(booking.total_amount)),
    service_type='package'
)

print(f"✅ Success!\n")
print(f"Reseller Entry (Org 44) - ID: {reseller_entry.id}")
print(f"   Narration: {reseller_entry.narration}")
for line in reseller_entry.lines.all():
    print(f"   - {line.account.name}: DR {line.debit}, CR {line.credit}, Balance: {line.balance_after}")

print(f"\nOwner Entry (Org 11) - ID: {owner_entry.id}")
print(f"   Narration: {owner_entry.narration}")
for line in owner_entry.lines.all():
    print(f"   - {line.account.name}: DR {line.debit}, CR {line.credit}, Balance: {line.balance_after}")

print(f"\n{'='*70}")
print(f"Now check the ledgers:")
print(f"  - Org 44 ledger should show 2 entries")
print(f"  - Org 11 ledger should show 1 entry")
print(f"{'='*70}\n")
