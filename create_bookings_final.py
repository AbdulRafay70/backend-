"""
Create bookings using organization 11, agency 41, and branch 46.
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

# Get organization, agency, and branch
org = Organization.objects.get(id=11)
agency = Agency.objects.get(id=41)
branch = Branch.objects.get(id=46)
user = User.objects.filter(is_superuser=True).first()

# Get packages
packages = list(UmrahPackage.objects.filter(organization=org).order_by('id'))

print("="*80)
print("CREATING BOOKINGS")
print("="*80)
print(f"Organization: {org.id}")
print(f"Agency: {agency.id}")
print(f"Branch: {branch.id}")
print(f"Packages: {len(packages)}")

# Booking configurations
bookings_config = [
    {
        'package_idx': 0,
        'adults': 2,
        'children': 1,
        'infants': 0,
        'booking_status': 'Approved',
        'visa_status': 'Approved',
        'room_type': 'triple',
    },
    {
        'package_idx': 1,
        'adults': 3,
        'children': 1,
        'infants': 0,
        'booking_status': 'Approved',
        'visa_status': 'Approved',
        'room_type': 'quad',
    },
    {
        'package_idx': 2,
        'adults': 2,
        'children': 0,
        'infants': 0,
        'booking_status': 'Pending',
        'visa_status': 'Pending',
        'room_type': 'double',
    },
    {
        'package_idx': 3,
        'adults': 4,
        'children': 1,
        'infants': 0,
        'booking_status': 'Approved',
        'visa_status': 'Approved',
        'room_type': 'quaint',
    },
    {
        'package_idx': 4,
        'adults': 3,
        'children': 1,
        'infants': 0,
        'booking_status': 'Confirmed',
        'visa_status': 'Approved',
        'room_type': 'quad',
    },
    {
        'package_idx': 5,
        'adults': 2,
        'children': 1,
        'infants': 0,
        'booking_status': 'Approved',
        'visa_status': 'Pending',
        'room_type': 'triple',
    },
]

created = 0

for idx, config in enumerate(bookings_config):
    if config['package_idx'] >= len(packages):
        continue
    
    package = packages[config['package_idx']]
    total = config['adults'] + config['children'] + config['infants']
    
    print(f"\n{'='*80}")
    print(f"Booking {idx+1}: {package.title}")
    
    try:
        booking = Booking.objects.create(
            user=user,
            organization=org,
            agency=agency,
            branch=branch,
            package=package,
            booking_status=config['booking_status'],
            visa_status=config['visa_status'],
            room_type=config['room_type'],
            adault=config['adults'],
            child=config['children'],
            infant=config['infants'],
            booking_date=datetime.now().date(),
            travel_date=datetime.now().date() + timedelta(days=15),
            total_amount=150000 * total,
            total_payment_received=0,
            is_active=True,
        )
        
        print(f"✅ Created booking #{booking.id}")
        print(f"   Status: {config['booking_status']} | Visa: {config['visa_status']}")
        print(f"   Passengers: {config['adults']}A, {config['children']}C, {config['infants']}I")
        created += 1
    except Exception as e:
        print(f"❌ Error: {str(e)[:100]}")

print(f"\n{'='*80}")
print(f"✅ CREATED {created}/{len(bookings_config)} BOOKINGS!")
print(f"{'='*80}")
