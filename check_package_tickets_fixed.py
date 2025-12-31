"""
Check package ticket details with correct field name.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from packages.models import UmrahPackage
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("CHECKING PACKAGE TICKET DETAILS")
print("="*80)

# Get packages
packages = UmrahPackage.objects.filter(organization=org).order_by('-id')[:3]

for package in packages:
    print(f"\n📦 Package: {package.title}")
    
    # Access ticket_details using the related_name
    ticket_details = package.ticket_details.all()
    print(f"   Ticket Details Count: {ticket_details.count()}")
    
    if ticket_details.count() > 0:
        for td in ticket_details:
            ticket = td.ticket
            print(f"\n   ✅ Has Ticket: {ticket.id}")
            print(f"      Airline: {ticket.airline.name if ticket.airline else 'N/A'}")
            
            # Get trip details
            from tickets.models import TicketTripDetails
            trips = TicketTripDetails.objects.filter(ticket=ticket)
            print(f"      Trip Details: {trips.count()}")
            
            for trip in trips:
                print(f"        - {trip.trip_type}: {trip.flight_number}")
                print(f"          {trip.departure_city} → {trip.arrival_city}")
                print(f"          Depart: {trip.departure_date_time}")
    else:
        print("   ❌ NO ticket details")

print(f"\n{'='*80}")
print("FRONTEND PATH:")
print("  booking.umrah_package.ticket_details[0].ticket.trip_details")
print("="*80)
