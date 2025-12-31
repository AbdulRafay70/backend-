"""
Check package ticket details structure.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from packages.models import UmrahPackage, UmrahPackageTicketDetails
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("CHECKING PACKAGE TICKET STRUCTURE")
print("="*80)

# Get one booking
booking = Booking.objects.filter(organization=org).order_by('-id').first()

if booking and booking.umrah_package:
    package = booking.umrah_package
    print(f"\n📦 Package: {package.title}")
    
    # Check package ticket details
    ticket_details = UmrahPackageTicketDetails.objects.filter(umrah_package=package)
    print(f"\n📋 Package Ticket Details: {ticket_details.count()}")
    
    for td in ticket_details:
        print(f"\n  Ticket Detail ID: {td.id}")
        print(f"  Ticket: {td.ticket.id if td.ticket else 'None'}")
        if td.ticket:
            print(f"  Airline: {td.ticket.airline.name if td.ticket.airline else 'N/A'}")
            
            # Get trip details
            from tickets.models import TicketTripDetails
            trips = TicketTripDetails.objects.filter(ticket=td.ticket)
            print(f"  Trip Details: {trips.count()}")
            
            for trip in trips:
                print(f"    - {trip.trip_type}: {trip.flight_number} ({trip.departure_city} → {trip.arrival_city})")
                print(f"      Depart: {trip.departure_date_time}")
                print(f"      Arrive: {trip.arrival_date_time}")

print(f"\n{'='*80}")
