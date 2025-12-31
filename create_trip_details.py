"""
Create BookingTicketTicketTripDetails with flight information.
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingTicketDetails, BookingTicketTicketTripDetails
from tickets.models import City

print("=" * 60)
print("CREATING BOOKING TICKET TRIP DETAILS")
print("=" * 60)

now = datetime.now()

# Get cities (use first match)
jeddah = City.objects.filter(name__icontains="Jeddah").first()
karachi = City.objects.filter(name__icontains="Karachi").first()

if not jeddah or not karachi:
    print("❌ Cities not found in database!")
    print(f"   Jeddah: {jeddah}")
    print(f"   Karachi: {karachi}")
    exit(1)

# Scenarios for different statuses
scenarios = [
    {
        'name': 'In Flight to KSA',
        'departure_datetime': now - timedelta(hours=2),
        'arrival_datetime': now + timedelta(hours=4),
    },
    {
        'name': 'Just Arrived in KSA',
        'departure_datetime': now - timedelta(days=1, hours=-14),
        'arrival_datetime': now - timedelta(days=1, hours=-6),
    },
    {
        'name': 'In Makkah',
        'departure_datetime': now - timedelta(days=5, hours=-16),
        'arrival_datetime': now - timedelta(days=5, hours=-8),
    },
    {
        'name': 'Exit Pending',
        'departure_datetime': now - timedelta(days=28, hours=-15),
        'arrival_datetime': now - timedelta(days=28, hours=-7),
    },
]

bookings = Booking.objects.filter(status__in=['Delivered', 'Approved'])

for idx, booking in enumerate(bookings[:len(scenarios)]):
    scenario = scenarios[idx]
    
    print(f"\n📦 Booking: {booking.booking_number}")
    print(f"   Scenario: {scenario['name']}")
    
    # Get booking ticket details
    booking_ticket = booking.ticket_details.first()
    
    if not booking_ticket:
        print("   ⚠️  No booking ticket details")
        continue
    
    # Check if trip details already exist
    if booking_ticket.trip_details.exists():
        print(f"   ℹ️  Already has {booking_ticket.trip_details.count()} trip details, deleting...")
        booking_ticket.trip_details.all().delete()
    
    # Create BookingTicketTicketTripDetails
    trip_detail = BookingTicketTicketTripDetails.objects.create(
        ticket=booking_ticket,
        departure_city=karachi,
        arrival_city=jeddah,
        departure_date_time=scenario['departure_datetime'],
        arrival_date_time=scenario['arrival_datetime'],
        trip_type="Outbound"
    )
    
    print(f"   ✅ Created trip: {trip_detail.departure_city.name} → {trip_detail.arrival_city.name}")
    print(f"      Departure: {scenario['departure_datetime'].strftime('%Y-%m-%d %H:%M')}")
    print(f"      Arrival: {scenario['arrival_datetime'].strftime('%Y-%m-%d %H:%M')}")

print("\n" + "=" * 60)
print("✅ Booking ticket trip details created!")
print("\nNow refresh the Pax Movement page!")
print("Passengers should show different statuses:")
print("  - In Flight ✈️")
print("  - Entered KSA �")
print("  - Exit Pending ⏳")
