import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

# Check packages for organization 11
pkgs = UmrahPackage.objects.filter(organization_id=11)
print(f'Total packages for org 11: {pkgs.count()}\n')

for p in pkgs:
    print(f'Package ID: {p.id}, Title: {p.title}')
    print(f'  - is_active: {p.is_active}')
    print(f'  - inventory_owner: {p.inventory_owner_organization_id}')
    print(f'  - reselling_allowed: {p.reselling_allowed}')
    
    # Check ticket details
    ticket_details = p.ticket_details.all()
    print(f'  - Ticket details count: {ticket_details.count()}')
    
    for td in ticket_details:
        ticket = td.ticket
        print(f'    - Ticket ID: {ticket.id}')
        
        # Check trip details
        trip_details = ticket.trip_details.all()
        print(f'      - Trip details count: {trip_details.count()}')
        
        for trip in trip_details:
            departure = trip.departure_date_time
            now = timezone.now()
            is_past = departure < now if departure else False
            print(f'        - Departure: {departure}, Is Past: {is_past}')
    
    print()
