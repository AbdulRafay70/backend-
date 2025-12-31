"""
Create bookings with correct field names from Booking model.
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from booking.models import Booking
from organization.models import Organization, Agency, Branch
from django.contrib.auth.models import User

# Get IDs
org = Organization.objects.get(id=11)
agency = Agency.objects.get(id=41)
branch = Branch.objects.get(id=46)
user = User.objects.filter(is_superuser=True).first()

# Get packages
packages = list(UmrahPackage.objects.filter(organization=org).order_by('id'))

print("="*80)
print("CREATING BOOKINGS WITH CORRECT FIELDS")
print("="*80)
print(f"Org: {org.id}, Agency: {agency.id}, Branch: {branch.id}")
print(f"Packages: {len(packages)}")

# Configurations
configs = [
    {'pkg_idx': 0, 'adults': 2, 'children': 1, 'infants': 0, 'status': 'Approved'},
    {'pkg_idx': 1, 'adults': 3, 'children': 1, 'infants': 0, 'status': 'Approved'},
    {'pkg_idx': 2, 'adults': 2, 'children': 0, 'infants': 0, 'status': 'Pending'},
    {'pkg_idx': 3, 'adults': 4, 'children': 1, 'infants': 0, 'status': 'Approved'},
    {'pkg_idx': 4, 'adults': 3, 'children': 1, 'infants': 0, 'status': 'Confirmed'},
    {'pkg_idx': 5, 'adults': 2, 'children': 1, 'infants': 0, 'status': 'Approved'},
]

created = 0

for idx, cfg in enumerate(configs):
    if cfg['pkg_idx'] >= len(packages):
        continue
    
    pkg = packages[cfg['pkg_idx']]
    total_pax = cfg['adults'] + cfg['children'] + cfg['infants']
    
    print(f"\n{'='*80}")
    print(f"Booking {idx+1}: {pkg.title}")
    
    try:
        booking = Booking.objects.create(
            user=user,
            organization=org,
            agency=agency,
            branch=branch,
            umrah_package=pkg,
            status=cfg['status'],
            booking_type='UMRAH',
            total_pax=total_pax,
            total_adult=cfg['adults'],
            total_child=cfg['children'],
            total_infant=cfg['infants'],
            total_amount=150000 * total_pax,
            paid_payment=0,
            pending_payment=150000 * total_pax,
            is_partial_payment_allowed=True,
        )
        
        print(f"✅ Booking #{booking.id} - {booking.booking_number}")
        print(f"   Status: {cfg['status']}")
        print(f"   Passengers: {cfg['adults']}A + {cfg['children']}C + {cfg['infants']}I = {total_pax}")
        print(f"   Amount: {booking.total_amount:,} PKR")
        created += 1
    except Exception as e:
        print(f"❌ Error: {str(e)[:150]}")

print(f"\n{'='*80}")
print(f"✅ CREATED {created}/{len(configs)} BOOKINGS!")
print(f"{'='*80}")
