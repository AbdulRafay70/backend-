"""
Create comprehensive sample bookings including:
- 5 Package bookings
- 2 Custom Umrah Calculator bookings (visa + transport + ticket + hotel)
- 1 Hotel only booking
- 1 Ticket only booking  
- 1 Visa only booking (using BookingPersonDetail)
- 1 Transport only booking

With single and multiple passengers
"""

import os
import django
import sys
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import (
    Booking, BookingHotelDetails, BookingTransportDetails,
    BookingTicketDetails, BookingPersonDetail
)
from packages.models import UmrahPackage
from organization.models import Organization, Branch, Agency
from django.contrib.auth.models import User
from tickets.models import Hotels
from booking.models import VehicleType, Sector

def get_or_create_test_data():
    """Get or create necessary test data"""
    # Get organization
    org = Organization.objects.first()
    if not org:
        print("❌ No organization found. Please create one first.")
        return None
        
    # Get branch
    branch = Branch.objects.filter(organization=org).first()
    if not branch:
        print("❌ No branch found. Please create one first.")
        return None
        
    # Get agency
    agency = Agency.objects.filter(branch=branch).first()
    if not agency:
        print("❌ No agency found. Please create one first.")
        return None
        
    # Get user
    user = User.objects.filter(is_staff=True).first()
    if not user:
        print("❌ No admin user found. Please create one first.")
        return None
    
    return {
        'org': org,
        'branch': branch,
        'agency': agency,
        'user': user
    }

def create_person(booking, passenger_type='adult', index=1):
    """Create a person detail for a booking"""
    first_names = ['Ahmed', 'Fatima', 'Ali', 'Aisha', 'Omar', 'Zainab', 'Hassan', 'Maryam']
    last_names = ['Khan', 'Ahmed', 'Ali', 'Hassan', 'Hussain', 'Malik', 'Shah', 'Raza']
    
    person = BookingPersonDetail.objects.create(
        booking=booking,
        first_name=random.choice(first_names),
        last_name=random.choice(last_names),
        passport_number=f"AB{random.randint(1000000, 9999999)}",
        contact_number=f"+92300{random.randint(1000000, 9999999)}",
        age_group=passenger_type,
        date_of_birth=datetime.now().date() - timedelta(days=365 * (30 if passenger_type == 'adult' else 10 if passenger_type == 'child' else 2)),
        country='Pakistan'
    )
    return person

def create_package_booking(test_data, package, num_passengers=2):
    """Create a package booking"""
    booking_number = f"PKG{random.randint(10000, 99999)}"
    
    booking = Booking.objects.create(
        user=test_data['user'],
        organization=test_data['org'],
        branch=test_data['branch'],
        agency=test_data['agency'],
        booking_number=booking_number,
        umrah_package=package,
        booking_type='UMRAH',
        is_full_package=True,
        total_pax=num_passengers,
        total_adult=num_passengers if num_passengers <= 2 else num_passengers - 1,
        total_child=0 if num_passengers <= 2 else 1,
        total_infant=0,
        total_amount=float(package.price_per_person) * num_passengers,
        total_in_pkr=float(package.price_per_person) * num_passengers,
        status='Confirmed',
        category='Package'
    )
    
    # Create person details
    for i in range(num_passengers):
        pax_type = 'adult' if i < (num_passengers - 1) or num_passengers <= 2 else 'child'
        create_person(booking, pax_type, i)
    
    print(f"✅ Created package booking: {booking_number} with {num_passengers} passengers")
    return booking

def create_custom_umrah_booking(test_data, num_passengers=3):
    """Create a custom umrah calculator booking with all services"""
    booking_number = f"CUS{random.randint(10000, 99999)}"
    
    # Get hotel
    hotel = Hotels.objects.filter(organization=test_data['org']).first()
    
    # Calculate amounts
    hotel_amount = 50000 * num_passengers
    visa_amount = 15000 * num_passengers
    transport_amount = 8000 * num_passengers
    ticket_amount = 75000 * num_passengers
    total = hotel_amount + visa_amount + transport_amount + ticket_amount
    
    booking = Booking.objects.create(
        user=test_data['user'],
        organization=test_data['org'],
        branch=test_data['branch'],
        agency=test_data['agency'],
        booking_number=booking_number,
        booking_type='OTHER',
        is_full_package=False,
        total_pax=num_passengers,
        total_adult=num_passengers - 1 if num_passengers > 1 else 1,
        total_child=1 if num_passengers > 1 else 0,
        total_infant=0,
        total_hotel_amount=hotel_amount,
        total_visa_amount=visa_amount,
        total_transport_amount=transport_amount,
        total_ticket_amount=ticket_amount,
        total_amount=total,
        total_in_pkr=total,
        status='Confirmed',
        category='Custom Umrah'
    )
    
    # Create person details
    for i in range(num_passengers):
        pax_type = 'adult' if i < num_passengers - 1 else 'child'
        person = create_person(booking, pax_type, i)
        # Add visa details to person
        person.visa_type = 'umrah'
        person.visa_category = '30_days'
        person.save()
    
    # Add hotel details
    if hotel:
        BookingHotelDetails.objects.create(
            booking=booking,
            hotel=hotel,
            check_in_date=datetime.now().date() + timedelta(days=30),
            check_out_date=datetime.now().date() + timedelta(days=45),
            room_type='quad',
            number_of_nights=15,
            price=3000,
            quantity=num_passengers // 2 + 1,
            total_price=hotel_amount
        )
    
    # Add transport details
    vehicle_type = VehicleType.objects.first()
    if vehicle_type:
        BookingTransportDetails.objects.create(
            booking=booking,
            vehicle_type=vehicle_type,
            from_location='Jeddah Airport',
            to_location='Makkah Hotel',
            transport_date=datetime.now().date() + timedelta(days=30),
            number_of_vehicles=1,
            total_amount=transport_amount
        )
    
    # Add ticket details
    from tickets.models import Ticket
    ticket = Ticket.objects.first()
    if ticket:
        BookingTicketDetails.objects.create(
            booking=booking,
            ticket=ticket,
            pnr=f"PNR{random.randint(100000, 999999)}",
            adult_price=75000,
            child_price=60000 if num_passengers > 1 else 0,
            infant_price=0,
            seats=num_passengers,
            trip_type='round_trip',
            departure_stay_type='direct',
            return_stay_type='direct',
            status='Confirmed'
        )
    
    print(f"✅ Created custom umrah booking: {booking_number} with {num_passengers} passengers (All services)")
    return booking

def create_hotel_only_booking(test_data, num_passengers=2):
    """Create a hotel-only booking"""
    booking_number = f"HTL{random.randint(10000, 99999)}"
    
    hotel = Hotels.objects.filter(organization=test_data['org']).first()
    hotel_amount = 45000 * num_passengers
    
    booking = Booking.objects.create(
        user=test_data['user'],
        organization=test_data['org'],
        branch=test_data['branch'],
        agency=test_data['agency'],
        booking_number=booking_number,
        booking_type='HOTEL',
        is_full_package=False,
        total_pax=num_passengers,
        total_adult=num_passengers,
        total_child=0,
        total_infant=0,
        total_hotel_amount=hotel_amount,
        total_amount=hotel_amount,
        total_in_pkr=hotel_amount,
        status='Confirmed',
        category='Hotel Only'
    )
    
    # Create person details
    for i in range(num_passengers):
        create_person(booking, 'adult', i)
    
    # Add hotel details
    if hotel:
        BookingHotelDetails.objects.create(
            booking=booking,
            hotel=hotel,
            check_in_date=datetime.now().date() + timedelta(days=20),
            check_out_date=datetime.now().date() + timedelta(days=35),
            room_type='double',
            number_of_nights=15,
            price=3000,
            quantity=num_passengers // 2,
            total_price=hotel_amount
        )
    
    print(f"✅ Created hotel-only booking: {booking_number} with {num_passengers} passengers")
    return booking

def create_ticket_only_booking(test_data, num_passengers=1):
    """Create a ticket-only booking"""
    booking_number = f"TKT{random.randint(10000, 99999)}"
    
    ticket_amount = 70000 * num_passengers
    
    booking = Booking.objects.create(
        user=test_data['user'],
        organization=test_data['org'],
        branch=test_data['branch'],
        agency=test_data['agency'],
        booking_number=booking_number,
        booking_type='TICKET',
        is_full_package=False,
        total_pax=num_passengers,
        total_adult=num_passengers,
        total_child=0,
        total_infant=0,
        total_ticket_amount=ticket_amount,
        total_amount=ticket_amount,
        total_in_pkr=ticket_amount,
        status='Confirmed',
        category='Ticket Only'
    )
    
    # Create person details
    for i in range(num_passengers):
        create_person(booking, 'adult', i)
    
    # Add ticket details
    from tickets.models import Ticket
    ticket = Ticket.objects.first()
    if ticket:
        BookingTicketDetails.objects.create(
            booking=booking,
            ticket=ticket,
            pnr=f"PNR{random.randint(100000, 999999)}",
            adult_price=ticket_amount,
            child_price=0,
            infant_price=0,
            seats=num_passengers,
            trip_type='round_trip',
            departure_stay_type='direct',
            return_stay_type='direct',
            status='Confirmed'
        )
    
    print(f"✅ Created ticket-only booking: {booking_number} with {num_passengers} passenger(s)")
    return booking

def create_visa_only_booking(test_data, num_passengers=4):
    """Create a visa-only booking"""
    booking_number = f"VSA{random.randint(10000, 99999)}"
    
    visa_amount = 12000 * num_passengers
    
    booking = Booking.objects.create(
        user=test_data['user'],
        organization=test_data['org'],
        branch=test_data['branch'],
        agency=test_data['agency'],
        booking_number=booking_number,
        booking_type='OTHER',
        is_full_package=False,
        total_pax=num_passengers,
        total_adult=num_passengers - 1,
        total_child=1,
        total_infant=0,
        total_visa_amount=visa_amount,
        total_amount=visa_amount,
        total_in_pkr=visa_amount,
        status='Confirmed',
        category='Visa Only'
    )
    
    # Create person details with visa info
    for i in range(num_passengers):
        pax_type = 'adult' if i < num_passengers - 1 else 'child'
        person = create_person(booking, pax_type, i)
        person.visa_type = 'umrah'
        person.visa_category = '30_days'
        person.save()
    
    print(f"✅ Created visa-only booking: {booking_number} with {num_passengers} passengers")
    return booking

def create_transport_only_booking(test_data, num_passengers=5):
    """Create a transport-only booking"""
    booking_number = f"TRN{random.randint(10000, 99999)}"
    
    transport_amount = 10000
    
    booking = Booking.objects.create(
        user=test_data['user'],
        organization=test_data['org'],
        branch=test_data['branch'],
        agency=test_data['agency'],
        booking_number=booking_number,
        booking_type='OTHER',
        is_full_package=False,
        total_pax=num_passengers,
        total_adult=num_passengers,
        total_child=0,
        total_infant=0,
        total_transport_amount=transport_amount,
        total_amount=transport_amount,
        total_in_pkr=transport_amount,
        status='Confirmed',
        category='Transport Only'
    )
    
    # Create person details
    for i in range(num_passengers):
        create_person(booking, 'adult', i)
    
    # Add transport details
    vehicle_type = VehicleType.objects.first()
    if vehicle_type:
        BookingTransportDetails.objects.create(
            booking=booking,
            vehicle_type=vehicle_type,
            from_location='Makkah',
            to_location='Madinah',
            transport_date=datetime.now().date() + timedelta(days=35),
            number_of_vehicles=1,
            total_amount=transport_amount
        )
    
    print(f"✅ Created transport-only booking: {booking_number} with {num_passengers} passengers")
    return booking

def main():
    print("=" * 60)
    print("Creating Comprehensive Sample Bookings")
    print("=" * 60)
    
    # Get test data
    test_data = get_or_create_test_data()
    if not test_data:
        return
    
    print(f"\n📋 Using Organization: {test_data['org'].name}")
    print(f"📋 Using Branch: {test_data['branch'].name}")
    print(f"📋 Using Agency: {test_data['agency'].name}")
    print(f"📋 Using User: {test_data['user'].username}\n")
    
    # Get packages
    packages = list(UmrahPackage.objects.filter(organization=test_data['org'])[:5])
    
    if len(packages) < 5:
        print(f"⚠️  Only {len(packages)} packages found. Creating bookings for available packages...")
    
    # 1. Create 5 Package Bookings
    print("\n" + "=" * 60)
    print("1. Creating Package Bookings (5)")
    print("=" * 60)
    
    passenger_counts = [1, 2, 3, 4, 5]  # Different passenger counts
    for i, package in enumerate(packages):
        create_package_booking(test_data, package, passenger_counts[i % len(passenger_counts)])
    
    # 2. Create 2 Custom Umrah Calculator Bookings
    print("\n" + "=" * 60)
    print("2. Creating Custom Umrah Calculator Bookings (2)")
    print("=" * 60)
    
    create_custom_umrah_booking(test_data, num_passengers=3)
    create_custom_umrah_booking(test_data, num_passengers=5)
    
    # 3. Create Hotel Only Booking
    print("\n" + "=" * 60)
    print("3. Creating Hotel Only Booking (1)")
    print("=" * 60)
    
    create_hotel_only_booking(test_data, num_passengers=2)
    
    # 4. Create Ticket Only Booking
    print("\n" + "=" * 60)
    print("4. Creating Ticket Only Booking (1)")
    print("=" * 60)
    
    create_ticket_only_booking(test_data, num_passengers=1)
    
    # 5. Create Visa Only Booking
    print("\n" + "=" * 60)
    print("5. Creating Visa Only Booking (1)")
    print("=" * 60)
    
    create_visa_only_booking(test_data, num_passengers=4)
    
    # 6. Create Transport Only Booking
    print("\n" + "=" * 60)
    print("6. Creating Transport Only Booking (1)")
    print("=" * 60)
    
    create_transport_only_booking(test_data, num_passengers=5)
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ BOOKING CREATION COMPLETE!")
    print("=" * 60)
    
    total_bookings = Booking.objects.filter(organization=test_data['org']).count()
    print(f"\n📊 Total bookings in system: {total_bookings}")
    print(f"📦 Package bookings: {Booking.objects.filter(organization=test_data['org'], booking_type='UMRAH').count()}")
    print(f"🏨 Hotel bookings: {Booking.objects.filter(organization=test_data['org'], booking_type='HOTEL').count()}")
    print(f"✈️  Ticket bookings: {Booking.objects.filter(organization=test_data['org'], booking_type='TICKET').count()}")
    print(f"🎫 Other bookings: {Booking.objects.filter(organization=test_data['org'], booking_type='OTHER').count()}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
