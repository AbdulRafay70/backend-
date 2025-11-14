"""Test enhanced ledger structure"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from ledger.models import LedgerEntry, LedgerLine

# Find a paid booking
booking = Booking.objects.filter(payment_status='Paid').first()
if not booking:
    print("No paid bookings found!")
    exit()

print(f"Booking: {booking.booking_number}")
print(f"Payment Status: {booking.payment_status}")
print(f"Total Amount: {booking.total_amount}")
print(f"Paid Amount: {booking.paid_payment}")

# Check if ledger entry exists
if booking.ledger_entry:
    ledger = booking.ledger_entry
    print(f"\n✅ Ledger Entry: #{ledger.id}")
    print(f"Reference No: {ledger.reference_no}")
    print(f"Transaction Type: {ledger.transaction_type}")
    print(f"Booking: {ledger.booking}")
    print(f"Organization: {ledger.organization}")
    print(f"Branch: {ledger.branch}")
    print(f"Agency: {ledger.agency}")
    print(f"Metadata: {ledger.metadata}")
    
    # Check ledger lines
    lines = ledger.lines.all()
    print(f"\nLedger Lines ({lines.count()}):")
    for line in lines:
        print(f"  - {line.account.name}: Debit={line.debit}, Credit={line.credit}, Balance={line.balance_after}")
else:
    print("\n❌ No ledger entry found. Creating one...")
    try:
        booking.create_ledger_entry()
        booking.refresh_from_db()
        print(f"✅ Created ledger entry: {booking.ledger_entry}")
    except Exception as e:
        print(f"❌ Error creating ledger: {e}")
        import traceback
        traceback.print_exc()

# Show all ledger entries
print(f"\n📊 Total Ledger Entries: {LedgerEntry.objects.count()}")
