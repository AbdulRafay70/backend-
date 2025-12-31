"""
Check ticket dates to see why packages are showing as past packages.
"""
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from tickets.models import Ticket
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("CHECKING PACKAGE AND TICKET DATES")
print("="*80)

today = datetime.now().date()
print(f"\nToday's date: {today}")

# Check packages
packages = UmrahPackage.objects.filter(organization=org).order_by('id')
print(f"\nFound {packages.count()} packages")

for package in packages:
    print(f"\n{'='*80}")
    print(f"Package: {package.title}")
    print(f"  Start Date: {package.start_date}")
    print(f"  End Date: {package.end_date}")
    print(f"  Status: {'PAST' if package.end_date < today else 'CURRENT/FUTURE'}")

# Check tickets
print(f"\n{'='*80}")
print("CHECKING TICKETS")
print(f"{'='*80}")

tickets = Ticket.objects.filter(organization=org).order_by('id')[:6]
print(f"\nFound {tickets.count()} tickets")

for ticket in tickets:
    print(f"\n{ticket.ticket_number}:")
    
    # Check trip details for departure dates
    if hasattr(ticket, 'trip_details'):
        trip_details = ticket.trip_details.all() if hasattr(ticket.trip_details, 'all') else []
        for trip in trip_details:
            if hasattr(trip, 'departure_date_time'):
                print(f"  Departure: {trip.departure_date_time}")
                if trip.departure_date_time:
                    dep_date = trip.departure_date_time.date() if hasattr(trip.departure_date_time, 'date') else trip.departure_date_time
                    print(f"  Status: {'PAST' if dep_date < today else 'FUTURE'}")

print("\n" + "="*80)
print("DIAGNOSIS:")
print("If tickets have past departure dates, packages will show as past.")
print("="*80)
