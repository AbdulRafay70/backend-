"""
Update all ticket departure dates to future dates.
This will make packages show as current/future instead of past.
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Ticket, TicketTripDetails
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("UPDATING TICKET DATES TO FUTURE")
print("="*80)

today = datetime.now()
print(f"\nToday: {today.date()}")

# Get tickets
tickets = list(Ticket.objects.filter(organization=org).order_by('id')[:6])
print(f"Found {len(tickets)} tickets to update")

# Update each ticket with future dates
for idx, ticket in enumerate(tickets):
    print(f"\n{'='*80}")
    print(f"Updating: {ticket.ticket_number}")
    
    # Set departure date to 3-10 days from now (different for each ticket)
    days_from_now = 3 + (idx * 2)  # 3, 5, 7, 9, 11, 13 days
    new_departure = today + timedelta(days=days_from_now)
    new_arrival = new_departure + timedelta(hours=6)  # 6 hour flight
    
    # Update trip details
    trip_details = TicketTripDetails.objects.filter(ticket=ticket)
    
    updated_trips = 0
    for trip in trip_details:
        trip.departure_date_time = new_departure
        trip.arrival_date_time = new_arrival
        trip.save()
        updated_trips += 1
    
    print(f"  ✅ Updated {updated_trips} trip(s)")
    print(f"  New departure: {new_departure.date()} {new_departure.time().strftime('%H:%M')}")
    print(f"  New arrival: {new_arrival.date()} {new_arrival.time().strftime('%H:%M')}")

print("\n" + "="*80)
print("✅ ALL TICKETS UPDATED WITH FUTURE DATES!")
print("="*80)
print("\nPackages should now display as CURRENT/FUTURE packages")
print("(not requiring 'Include Past Packages' to be checked)")
