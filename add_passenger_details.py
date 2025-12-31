"""
Add passenger details (names, passport info) to existing bookings.
"""
import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail

print("="*80)
print("ADDING PASSENGER DETAILS TO BOOKINGS")
print("="*80)

# Get all bookings
bookings = Booking.objects.filter(organization_id=11).order_by('-id')[:6]
print(f"\nFound {bookings.count()} bookings")

# Sample passenger data
passenger_data = [
    {'first': 'Ahmed', 'last': 'Khan', 'gender': 'Male', 'type': 'adult'},
    {'first': 'Fatima', 'last': 'Ali', 'gender': 'Female', 'type': 'adult'},
    {'first': 'Muhammad', 'last': 'Hassan', 'gender': 'Male', 'type': 'adult'},
    {'first': 'Aisha', 'last': 'Malik', 'gender': 'Female', 'type': 'child'},
    {'first': 'Omar', 'last': 'Siddiqui', 'gender': 'Male', 'type': 'adult'},
    {'first': 'Zainab', 'last': 'Ahmed', 'gender': 'Female', 'type': 'adult'},
    {'first': 'Ibrahim', 'last': 'Raza', 'gender': 'Male', 'type': 'adult'},
    {'first': 'Maryam', 'last': 'Hussain', 'gender': 'Female', 'type': 'child'},
    {'first': 'Yusuf', 'last': 'Sheikh', 'gender': 'Male', 'type': 'adult'},
    {'first': 'Khadija', 'last': 'Iqbal', 'gender': 'Female', 'type': 'adult'},
]

passenger_idx = 0
total_created = 0

for booking in bookings:
    print(f"\n{'='*80}")
    print(f"Booking #{booking.id} - {booking.booking_number}")
    print(f"  Package: {booking.umrah_package.title if booking.umrah_package else 'N/A'}")
    print(f"  Passengers needed: {booking.total_adult} Adults, {booking.total_child} Children")
    
    # Create passenger details
    passengers_created = 0
    
    # Create adults
    for i in range(booking.total_adult):
        if passenger_idx >= len(passenger_data):
            passenger_idx = 0
        
        p_data = passenger_data[passenger_idx]
        passenger_idx += 1
        
        # Generate dates
        dob = datetime.now().date() - timedelta(days=365*random.randint(25, 55))
        passport_expiry = datetime.now().date() + timedelta(days=365*3)
        
        person = BookingPersonDetail.objects.create(
            booking=booking,
            first_name=p_data['first'],
            last_name=p_data['last'],
            age_group='adult',
            person_title='Mr' if p_data['gender'] == 'Male' else 'Mrs',
            date_of_birth=dob,
            passport_number=f"PK{random.randint(1000000, 9999999)}",
            passport_expiry_date=passport_expiry,
            country='Pakistan',
            is_visa_included=True,
            visa_status='Approved' if booking.status == 'Approved' else 'Pending',
            ticket_status='Confirmed' if booking.status == 'Approved' else 'Pending',
        )
        passengers_created += 1
    
    # Create children
    for i in range(booking.total_child):
        if passenger_idx >= len(passenger_data):
            passenger_idx = 0
        
        p_data = passenger_data[passenger_idx]
        passenger_idx += 1
        
        dob = datetime.now().date() - timedelta(days=365*random.randint(5, 12))
        passport_expiry = datetime.now().date() + timedelta(days=365*3)
        
        person = BookingPersonDetail.objects.create(
            booking=booking,
            first_name=p_data['first'],
            last_name=p_data['last'],
            age_group='child',
            person_title='Master' if p_data['gender'] == 'Male' else 'Miss',
            date_of_birth=dob,
            passport_number=f"PK{random.randint(1000000, 9999999)}",
            passport_expiry_date=passport_expiry,
            country='Pakistan',
            is_visa_included=True,
            visa_status='Approved' if booking.status == 'Approved' else 'Pending',
            ticket_status='Confirmed' if booking.status == 'Approved' else 'Pending',
        )
        passengers_created += 1
    
    print(f"  ✅ Created {passengers_created} passenger details")
    total_created += passengers_created

print(f"\n{'='*80}")
print(f"✅ CREATED {total_created} PASSENGER DETAILS!")
print(f"{'='*80}")

# Show summary
print("\n📋 BOOKING SUMMARY WITH PASSENGERS:")
for booking in bookings:
    passengers = BookingPersonDetail.objects.filter(booking=booking)
    print(f"\nBooking #{booking.id} ({booking.booking_number}):")
    print(f"  Status: {booking.status}")
    print(f"  Passengers ({passengers.count()}):")
    for p in passengers:
        print(f"    - {p.first_name} {p.last_name} ({p.age_group}, {p.person_title})")
        print(f"      Passport: {p.passport_number}, DOB: {p.date_of_birth}, Visa: {p.visa_status}")
