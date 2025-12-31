"""
Create multiple bookings for different packages with passenger details.
Some bookings will have approved visa and booking status.
"""
import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from booking.models import Booking
from organization.models import Organization, Agency
from django.contrib.auth.models import User

# Get organization 11
org = Organization.objects.get(id=11)

# Get or create a user for bookings
user = User.objects.filter(is_superuser=True).first()

# Get or create an agency
agency = Agency.objects.filter(organization=org).first()
if not agency:
    agency = Agency.objects.create(
        organization=org,
        name="Main Agency",
        contact_person="Admin",
        phone="03001234567"
    )

# Get packages
packages = list(UmrahPackage.objects.filter(organization=org).order_by('id'))

print("="*80)
print("CREATING BOOKINGS WITH PASSENGER DETAILS")
print("="*80)
print(f"\nFound {len(packages)} packages")
print(f"Using agency: {agency.name}")

# Booking configurations
bookings_config = [
    {
        'package_idx': 0,
        'num_adults': 2,
        'num_children': 1,
        'num_infants': 0,
        'booking_status': 'Approved',
        'visa_status': 'Approved',
        'room_type': 'triple',
    },
    {
        'package_idx': 1,
        'num_adults': 3,
        'num_children': 1,
        'num_infants': 0,
        'booking_status': 'Approved',
        'visa_status': 'Approved',
        'room_type': 'quad',
    },
    {
        'package_idx': 2,
        'num_adults': 2,
        'num_children': 0,
        'num_infants': 0,
        'booking_status': 'Pending',
        'visa_status': 'Pending',
        'room_type': 'double',
    },
    {
        'package_idx': 3,
        'num_adults': 4,
        'num_children': 1,
        'num_infants': 0,
        'booking_status': 'Approved',
        'visa_status': 'Approved',
        'room_type': 'quaint',
    },
    {
        'package_idx': 4,
        'num_adults': 3,
        'num_children': 1,
        'num_infants': 0,
        'booking_status': 'Confirmed',
        'visa_status': 'Approved',
        'room_type': 'quad',
    },
    {
        'package_idx': 5,
        'num_adults': 2,
        'num_children': 1,
        'num_infants': 0,
        'booking_status': 'Approved',
        'visa_status': 'Pending',
        'room_type': 'triple',
    },
]

created_bookings = []

for idx, config in enumerate(bookings_config):
    if config['package_idx'] >= len(packages):
        print(f"\nSkipping booking {idx+1} - package not available")
        continue
    
    package = packages[config['package_idx']]
    total_passengers = config['num_adults'] + config['num_children'] + config['num_infants']
    
    print(f"\n{'='*80}")
    print(f"Creating Booking {idx+1}/{len(bookings_config)}")
    print(f"Package: {package.title}")
    
    # Create booking
    booking = Booking.objects.create(
        user=user,
        organization=org,
        agency=agency,
        package=package,
        booking_status=config['booking_status'],
        visa_status=config['visa_status'],
        room_type=config['room_type'],
        
        # Passenger counts
        adault=config['num_adults'],
        child=config['num_children'],
        infant=config['num_infants'],
        
        # Dates
        booking_date=datetime.now().date(),
        travel_date=datetime.now().date() + timedelta(days=15),
        
        # Amounts (simplified calculation)
        total_amount=150000 * total_passengers,
        total_payment_received=0 if config['booking_status'] != 'Approved' else 50000,
        
        # Status flags
        is_active=True,
    )
    
    print(f"✅ Booking #{booking.id} created")
    print(f"   Status: {config['booking_status']}")
    print(f"   Visa Status: {config['visa_status']}")
    print(f"   Room Type: {config['room_type']}")
    print(f"   Passengers: {config['num_adults']} Adults, {config['num_children']} Children, {config['num_infants']} Infants")
    print(f"   Total Amount: {booking.total_amount:,} PKR")
    
    created_bookings.append(booking)

print("\n" + "="*80)
print(f"✅ CREATED {len(created_bookings)} BOOKINGS!")
print("="*80)

# Summary
print("\n📋 BOOKING SUMMARY:")
for booking in created_bookings:
    print(f"\nBooking #{booking.id}:")
    print(f"  Package: {booking.package.title}")
    print(f"  Status: {booking.booking_status} | Visa: {booking.visa_status}")
    print(f"  Room: {booking.room_type}")
    print(f"  Passengers: {booking.adault} Adults, {booking.child} Children, {booking.infant} Infants")
    print(f"  Amount: {booking.total_amount:,} PKR")
