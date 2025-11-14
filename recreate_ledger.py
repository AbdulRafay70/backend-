"""Delete old ledger entry and create a new one"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from ledger.models import LedgerEntry

# Find the booking
booking = Booking.objects.filter(booking_number='BK-20251101-DC2C').first()

if booking:
    print(f"Booking: {booking.booking_number}")
    print(f"Payment Status: {booking.payment_status}")
    print(f"Organization: {booking.organization}")
    print(f"Branch: {booking.branch}")
    print(f"Agency: {booking.agency}")
    
    # Delete old ledger entry
    old_ledger = booking.ledger_entry
    if old_ledger:
        print(f"\nDeleting old ledger entry #{old_ledger.id}")
        old_ledger.delete()
        booking.ledger_entry = None
        booking.save(update_fields=['ledger_entry'])
    
    # Create new ledger entry with enhanced structure
    print("\nCreating new ledger entry...")
    try:
        ledger_entry = booking.create_ledger_entry()
        if ledger_entry:
            # Save the ledger_entry to the booking
            booking.ledger_entry = ledger_entry
            booking.save(update_fields=['ledger_entry'])
            booking.refresh_from_db()
            
            ledger = booking.ledger_entry
            print(f"\n✅ New Ledger Entry: #{ledger.id}")
            print(f"Reference No: {ledger.reference_no}")
            print(f"Transaction Type: {ledger.transaction_type}")
            print(f"Booking: {ledger.booking}")
            print(f"Organization: {ledger.organization}")
            print(f"Branch: {ledger.branch}")
            print(f"Agency: {ledger.agency}")
            print(f"Metadata keys: {ledger.metadata.keys()}")
            
            # Check ledger lines
            lines = ledger.lines.all()
            print(f"\nLedger Lines ({lines.count()}):")
            for line in lines:
                print(f"  - {line.account.name}: Debit={line.debit}, Credit={line.credit}, Balance After={line.balance_after}, Remarks={line.remarks}")
        else:
            print("❌ create_ledger_entry() returned None")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("Booking not found!")
