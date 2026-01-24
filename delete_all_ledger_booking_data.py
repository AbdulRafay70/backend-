"""
Delete all booking and ledger data
WARNING: This will permanently delete all booking and ledger entries!
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from ledger.models import LedgerEntry, LedgerLine, Account, InterOrgPayment

print(f"\n{'='*70}")
print("DELETING ALL BOOKING AND LEDGER DATA")
print(f"{'='*70}\n")

# Count before deletion
booking_count = Booking.objects.count()
ledger_entry_count = LedgerEntry.objects.count()
ledger_line_count = LedgerLine.objects.count()
interorg_payment_count = InterOrgPayment.objects.count()

print(f"Found:")
print(f"  - {booking_count} bookings")
print(f"  - {ledger_entry_count} ledger entries")
print(f"  - {ledger_line_count} ledger lines")
print(f"  - {interorg_payment_count} inter-org payments\n")

# Delete all inter-org payments
print("Deleting inter-org payments...")
InterOrgPayment.objects.all().delete()
print(f"✅ Deleted {interorg_payment_count} inter-org payments")

# Delete all ledger lines
print("Deleting ledger lines...")
LedgerLine.objects.all().delete()
print(f"✅ Deleted {ledger_line_count} ledger lines")

# Delete all ledger entries
print("Deleting ledger entries...")
LedgerEntry.objects.all().delete()
print(f"✅ Deleted {ledger_entry_count} ledger entries")

# Delete all bookings (this will cascade delete related records)
print("Deleting bookings...")
Booking.objects.all().delete()
print(f"✅ Deleted {booking_count} bookings")

# Reset account balances to 0
print("\nResetting account balances to 0...")
account_count = Account.objects.update(balance=0)
print(f"✅ Reset {account_count} account balances")

print(f"\n{'='*70}")
print("ALL BOOKING AND LEDGER DATA DELETED SUCCESSFULLY")
print(f"{'='*70}\n")
