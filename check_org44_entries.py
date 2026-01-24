"""
Check the actual ledger entries and their lines for Org 44
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import LedgerEntry

booking_number = "BK-20260123-2253CB"
org_44_id = 44

print(f"\n{'='*80}")
print(f"Org 44's Ledger Entries for {booking_number}")
print(f"{'='*80}\n")

entries = LedgerEntry.objects.filter(
    booking_no=booking_number,
    organization_id=org_44_id
).order_by('created_at')

for i, entry in enumerate(entries, 1):
    print(f"Entry {i}: ID {entry.id}")
    print(f"  Narration: {entry.narration}")
    print(f"  Service Type: {entry.service_type}")
    print(f"  Lines:")
    for line in entry.lines.all():
        print(f"    - {line.account.name} (Org {line.account.organization_id})")
        print(f"      DR: {line.debit}, CR: {line.credit}")
    print()

print("The UI should display:")
print("1. Entry for main booking: Customer Receivable DR 1292")
print("2. Entry for inter-org payable: Accounts Payable CR 20")
print("\nBut it's showing the Receivable line (DR 20) instead of Payable line (CR 20)")
