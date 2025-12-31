"""
Create multiple bookings with multiple passengers for different packages.
Some bookings will have approved visa and booking status.
"""
import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from booking.models import Booking, Passenger
from organization.models import Organization
from django.contrib.auth.models import User

# Get organization 11
org = Organization.objects.get(id=11)

# Get packages
packages = list(UmrahPackage.objects.filter(organization=org).order_by('id'))

print("="*80)
print("CREATING BOOKINGS WITH PASSENGERS")
print("="*80)
print(f"\nFound {len(packages)} packages")

# Sample passenger data
passenger_names = [
    ('Ahmed', 'Khan', 'Male'),
    ('Fatima', 'Ali', 'Female'),
    ('Muhammad', 'Hassan', 'Male'),
    ('Aisha', 'Malik', 'Female'),
    ('Omar', 'Siddiqui', 'Male'),
    ('Zainab', 'Ahmed', 'Female'),
    ('Ibrahim', 'Raza', 'Male'),
    ('Maryam', 'Hussain', 'Female'),
    ('Yusuf', 'Sheikh', 'Male'),
    ('Khadija', 'Iqbal', 'Female'),
    ('Ali', 'Farooq', 'Male'),
    ('Hafsa', 'Nawaz', 'Female'),
]

# Booking configurations
bookings_config = [
    {
        'package_idx': 0,
        'num_passengers': 3,
        'booking_status': 'approved',
        'visa_status': 'approved',
        'room_type': 'triple',
    },
    {
        'package_idx': 1,
        'num_passengers': 4,
        'booking_status': 'approved',
        'visa_status': 'approved',
        'room_type': 'quad',
    },
    {
        'package_idx': 2,
        'num_passengers': 2,
        'booking_status': 'pending',
        'visa_status': 'pending',
        'room_type': 'double',
    },
    {
        'package_idx': 3,
        'num_passengers': 5,
        'booking_status': 'approved',
        'visa_status': 'approved',
        'room_type': 'quaint',
    },
    {
        'package_idx': 4,
        'num_passengers': 4,
        'booking_status': 'confirmed',
        'visa_status': 'approved',
        'room_type': 'quad',
    },
    {
        'package_idx': 5,
        'num_passengers': 3,
        'booking_status': 'approved',
        'visa_status': 'pending',
        'room_type': 'triple',
    },
]

created_bookings = []
passenger_idx = 0

for idx, config in enumerate(bookings_config):
    if config['package_idx'] >= len(packages):
        print(f"\nSkipping booking {idx+1} - package not available")
        continue
    
    package = packages[config['package_idx']]
    
    print(f"\n{'='*80}")
    print(f"Creating Booking {idx+1}/{len(bookings_config)}")
    print(f"Package: {package.title}")
    
    # Create booking
    booking = Booking.objects.create(
        organization=org,
        package=package,
        booking_status=config['booking_status'],
        visa_status=config['visa_status'],
        room_type=config['room_type'],
        total_passengers=config['num_passengers'],
        booking_date=datetime.now().date(),
        travel_date=datetime.now().date() + timedelta(days=10),
        total_amount=package.price_per_person * config['num_passengers'] if hasattr(package, 'price_per_person') else 0,
        paid_amount=0,
        remaining_amount=package.price_per_person * config['num_passengers'] if hasattr(package, 'price_per_person') else 0,
    )
    
    print(f"✅ Booking created: {booking.id}")
    print(f"   Status: {config['booking_status']}")
    print(f"   Visa Status: {config['visa_status']}")
    print(f"   Room Type: {config['room_type']}")
    print(f"   Passengers: {config['num_passengers']}")
    
    # Create passengers for this booking
    passengers_created = []
    for p in range(config['num_passengers']):
        if passenger_idx >= len(passenger_names):
            passenger_idx = 0  # Reset if we run out of names
        
        first_name, last_name, gender = passenger_names[passenger_idx]
        passenger_idx += 1
        
        # Determine passenger type
        if p == 0:
            passenger_type = 'adult'
        elif p < config['num_passengers'] - 1:
            passenger_type = random.choice(['adult', 'child'])
        else:
            passenger_type = random.choice(['adult', 'child', 'infant'])
        
        passenger = Passenger.objects.create(
            booking=booking,
            first_name=first_name,
            last_name=last_name,
            gender=gender,
            passenger_type=passenger_type,
            date_of_birth=datetime.now().date() - timedelta(days=365*30) if passenger_type == 'adult' else datetime.now().date() - timedelta(days=365*5),
            passport_number=f"PK{random.randint(1000000, 9999999)}",
            passport_expiry=datetime.now().date() + timedelta(days=365*3),
            nationality='Pakistani',
        )
        
        passengers_created.append(f"{first_name} {last_name} ({passenger_type})")
    
    print(f"   Passengers: {', '.join(passengers_created)}")
    created_bookings.append(booking)

print("\n" + "="*80)
print(f"✅ CREATED {len(created_bookings)} BOOKINGS WITH PASSENGERS!")
print("="*80)

# Summary
print("\n📋 BOOKING SUMMARY:")
for booking in created_bookings:
    passengers = Passenger.objects.filter(booking=booking)
    print(f"\nBooking #{booking.id}:")
    print(f"  Package: {booking.package.title}")
    print(f"  Status: {booking.booking_status} | Visa: {booking.visa_status}")
    print(f"  Room: {booking.room_type}")
    print(f"  Passengers ({passengers.count()}): {', '.join([f'{p.first_name} {p.last_name}' for p in passengers])}")
