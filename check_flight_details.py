"""
Check if bookings have flight/ticket details and what the structure looks like.
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("CHECKING FLIGHT/TICKET DETAILS IN BOOKINGS")
print("="*80)

# Get one booking to inspect
booking = Booking.objects.filter(organization=org).order_by('-id').first()

if booking:
    print(f"\n📊 Booking: {booking.booking_number}")
    print(f"Package: {booking.umrah_package.title if booking.umrah_package else 'None'}")
    
    # Check if package has ticket
    if booking.umrah_package and booking.umrah_package.ticket:
        ticket = booking.umrah_package.ticket
        print(f"\n✅ Package has ticket: {ticket.id}")
        print(f"Ticket Type: {ticket.ticket_type}")
        print(f"Airline: {ticket.airline.name if ticket.airline else 'N/A'}")
        
        # Check trip details
        from tickets.models import TicketTripDetails
        trip_details = TicketTripDetails.objects.filter(ticket=ticket)
        print(f"\n📋 Trip Details Count: {trip_details.count()}")
        
        for i, trip in enumerate(trip_details, 1):
            print(f"\n  Trip {i}:")
            print(f"    Type: {trip.trip_type}")
            print(f"    Flight: {trip.flight_number}")
            print(f"    From: {trip.departure_city}")
            print(f"    To: {trip.arrival_city}")
            print(f"    Departure: {trip.departure_date_time}")
            print(f"    Arrival: {trip.arrival_date_time}")
    else:
        print("\n❌ Package has NO ticket assigned")
        
    # Check booking ticket details
    from booking.models import BookingTicketDetails
    booking_tickets = BookingTicketDetails.objects.filter(booking=booking)
    print(f"\n📋 Booking Ticket Details Count: {booking_tickets.count()}")
    
    for bt in booking_tickets:
        print(f"  Ticket: {bt.ticket.id if bt.ticket else 'None'}")
        
else:
    print("No bookings found!")

print(f"\n{'='*80}")
print("RECOMMENDATION:")
print("If package has ticket with trip_details, the frontend should access:")
print("  booking.umrah_package.ticket.trip_details")
print("="*80)
