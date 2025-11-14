"""Test ledger reversal functionality"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from ledger.models import LedgerEntry, LedgerLine

# Find a booking with a ledger entry
booking = Booking.objects.filter(ledger_entry__isnull=False).first()

if not booking:
    print("❌ No bookings with ledger entries found!")
    exit()

ledger_entry = booking.ledger_entry

print(f"Original Ledger Entry: #{ledger_entry.id}")
print(f"Booking: {ledger_entry.booking_no}")
print(f"Organization: {ledger_entry.organization}")
print(f"Branch: {ledger_entry.branch}")
print(f"Agency: {ledger_entry.agency}")
print(f"Transaction Type: {ledger_entry.transaction_type}")
print(f"Reversed: {ledger_entry.reversed}")

print("\nOriginal Ledger Lines:")
for line in ledger_entry.lines.all():
    print(f"  - {line.account.name}: Debit={line.debit}, Credit={line.credit}, Balance={line.balance_after}")

print(f"\n✅ Ledger entry #{ledger_entry.id} is ready for reversal testing")
print(f"Test with: POST /api/ledger/reverse/{ledger_entry.id}/")
