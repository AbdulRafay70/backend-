"""
Verify the flight date updates for passenger movement tracking.
"""
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

print("=" * 60)
print("VERIFICATION: FLIGHT DATES FOR PAX MOVEMENT")
print("=" * 60)

now = datetime.now()
bookings = Booking.objects.filter(status__in=['Delivered', 'Approved'])[:4]

for booking in bookings:
    print(f"\n📦 Booking: {booking.booking_number} ({booking.status})")
    
    ticket_details = booking.ticket_details.first()
    if ticket_details and ticket_details.ticket:
        ticket = ticket_details.ticket
        print(f"   Ticket: {ticket.ticket_number}")
        
        trip_details = ticket.trip_details.all()
        for trip in trip_details:
            print(f"   ✈️  {trip.departure_city} → {trip.arrival_city}")
            print(f"      Departure: {trip.departure_date_time}")
            print(f"      Arrival: {trip.arrival_date_time}")
    
    transport = booking.transport_details.first()
    if transport and transport.sector_details.exists():
        for sector in transport.sector_details.all():
            print(f"   🚗 Transport: {sector.departure_city} → {sector.arrival_city}")
            print(f"      Date: {sector.date}")

print("\n" + "=" * 60)
print("✅ Verification complete!")
