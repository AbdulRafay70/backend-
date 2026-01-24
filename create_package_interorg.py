"""
Manually create inter-org entries for package booking BK-20260123-DE88AA
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
print(f"Creating inter-org entries for package booking {booking_number}")
print(f"{'='*70}\n")

booking = Booking.objects.get(booking_number=booking_number)

print(f"Booking: {booking.booking_number}")
print(f"Type: {booking.booking_type}")
print(f"Booking Org: {booking.organization.name} (ID: {booking.organization_id})")
print(f"Total Amount: PKR {booking.total_amount}")

# Check if this is a package and if it has an organization
if booking.umrah_package and booking.umrah_package.organization:
    package_owner_org = booking.umrah_package.organization
    booking_org = booking.organization
    
    print(f"\nPackage: {booking.umrah_package.package_name}")
    print(f"Package Owner: {package_owner_org.name} (ID: {package_owner_org.id})")
    
    if package_owner_org.id != booking_org.id:
        print(f"\n📦 This IS an inter-org package booking!")
        print(f"   Reseller: Org {booking_org.id}")
        print(f"   Owner: Org {package_owner_org.id}")
        print(f"   Amount: PKR {booking.total_amount}\n")
        
        print(f"Creating inter-org ledger entries...\n")
        
        reseller_entry, owner_entry = create_interorg_ledger_entries(
            booking=booking,
            reseller_org_id=booking_org.id,
            owner_org_id=package_owner_org.id,
            amount=Decimal(str(booking.total_amount)),
            service_type='package'
        )
        
        print(f"✅ Success!\n")
        print(f"Reseller Entry (Org {booking_org.id}) - ID: {reseller_entry.id}")
        print(f"   Narration: {reseller_entry.narration}")
        for line in reseller_entry.lines.all():
            print(f"   - {line.account.name}: DR {line.debit}, CR {line.credit}, Balance: {line.balance_after}")
        
        print(f"\nOwner Entry (Org {package_owner_org.id}) - ID: {owner_entry.id}")
        print(f"   Narration: {owner_entry.narration}")
        for line in owner_entry.lines.all():
            print(f"   - {line.account.name}: DR {line.debit}, CR {line.credit}, Balance: {line.balance_after}")
    else:
        print(f"\n❌ Same organization - not a reseller scenario")
else:
    print(f"\n⚠️ Package doesn't have an organization set!")
    print(f"   Package ID: {booking.umrah_package_id if booking.umrah_package else 'None'}")
    print(f"   Please set the package's organization field in the admin panel")

print(f"\n{'='*70}\n")
