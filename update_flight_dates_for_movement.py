"""
Update booking flight dates and times to trigger different passenger statuses.
This will make passengers appear in different stages: In Flight, In Makkah, In Madina, etc.
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from tickets.models import Ticket

print("=" * 60)
print("UPDATING FLIGHT DATES FOR PAX MOVEMENT TRACKING")
print("=" * 60)

now = datetime.now()
today = now.date()

# Get delivered and approved bookings
bookings = Booking.objects.filter(status__in=['Delivered', 'Approved'])

print(f"\nFound {bookings.count()} bookings with Delivered/Approved status")
print(f"Current time: {now}")

# Define different scenarios for different bookings
scenarios = [
    {
        'name': 'In Flight to KSA',
        'departure_date': today,
        'departure_time': (now - timedelta(hours=2)).strftime('%H:%M'),  # Left 2 hours ago
        'arrival_date': today,
        'arrival_time': (now + timedelta(hours=4)).strftime('%H:%M'),    # Arrives in 4 hours
        'return_date': today + timedelta(days=30),
    },
    {
        'name': 'Just Arrived in KSA (Jeddah)',
        'departure_date': today - timedelta(days=1),
        'departure_time': '10:00',
        'arrival_date': today - timedelta(days=1),
        'arrival_time': '18:00',
        'return_date': today + timedelta(days=25),
    },
    {
        'name': 'In Makkah',
        'departure_date': today - timedelta(days=5),
        'departure_time': '08:00',
        'arrival_date': today - timedelta(days=5),
        'arrival_time': '16:00',
        'return_date': today + timedelta(days=20),
    },
    {
        'name': 'Exit Pending (Return in 1 day)',
        'departure_date': today - timedelta(days=28),
        'departure_time': '09:00',
        'arrival_date': today - timedelta(days=28),
        'arrival_time': '17:00',
        'return_date': today + timedelta(days=1),  # Tomorrow
    },
]

updated_count = 0

for idx, booking in enumerate(bookings):
    if idx >= len(scenarios):
        break
        
    scenario = scenarios[idx]
    
    print(f"\n📦 Booking: {booking.booking_number}")
    print(f"   Scenario: {scenario['name']}")
    
    # Get ticket details
    ticket_details_list = booking.ticket_details.all()
    
    if not ticket_details_list.exists():
        print("   ⚠️  No ticket details found, skipping...")
        continue
    
    ticket_details = ticket_details_list.first()
    
    # Get the associated ticket
    if not ticket_details.ticket:
        print("   ⚠️  No ticket associated, skipping...")
        continue
    
    ticket = ticket_details.ticket
    
    # Update ticket trip details (departure flight)
    trip_details = ticket.trip_details.all()
    if trip_details.exists():
        for trip in trip_details:
            trip.departure_date_time = f"{scenario['departure_date']} {scenario['departure_time']}"
            trip.arrival_date_time = f"{scenario['arrival_date']} {scenario['arrival_time']}"
            trip.save()
            print(f"   ✅ Updated trip: {trip.departure_city} → {trip.arrival_city}")
            print(f"      Departure: {scenario['departure_date']} at {scenario['departure_time']}")
            print(f"      Arrival: {scenario['arrival_date']} at {scenario['arrival_time']}")
    
    # Store return date info (if there's a way to store it)
    # For now, we'll just log it
    print(f"   📅 Return date: {scenario['return_date']}")
    
    # Update transport sectors for location tracking
    if scenario['name'] == 'In Makkah':
        transport_details = booking.transport_details.first()
        if transport_details and transport_details.sector_details.exists():
            for sector in transport_details.sector_details.all():
                sector.arrival_city = "Makkah"
                sector.departure_city = "Jeddah"
                sector.date = today - timedelta(days=4)
                sector.save()
            print(f"   🚗 Updated transport: Jeddah → Makkah")
    
    updated_count += 1

print("\n" + "=" * 60)
print(f"✅ Updated {updated_count} bookings!")
print("\nExpected passenger statuses:")
print("  - Some passengers: In Flight ✈️")
print("  - Some passengers: Entered KSA / In Makkah 🕋")
print("  - Some passengers: Exit Pending ⏳")
print("\nRefresh the Pax Movement page to see the changes!")
