import os
import sys
import django

# Setup Django
project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_path)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from packages.models import UmrahPackage
from django.utils import timezone
from django.db.models import Q

# Get the package
p = UmrahPackage.objects.get(id=10)
print(f"\n=== Package Info ===")
print(f"ID: {p.id}")
print(f"Title: {p.title}")
print(f"Organization ID: {p.organization_id}")
print(f"Is Active: {p.is_active}")

# Check ticket details
print(f"\n=== Ticket Details ===")
ticket_details = p.ticket_details.all()
print(f"Has ticket_details: {ticket_details.exists()}")
print(f"Count: {ticket_details.count()}")

if ticket_details.exists():
    for td in ticket_details:
        if td.ticket:
            print(f"\nTicket ID: {td.ticket.id}")
            print(f"  Has trip_details: {td.ticket.trip_details.exists()}")
            
            for trip in td.ticket.trip_details.all():
                now = timezone.now()
                is_past = trip.departure_date_time < now
                print(f"  Departure: {trip.departure_date_time}")
                print(f"  Is Past: {is_past}")
                print(f"  Current time: {now}")

# Test the exact query from the view
print(f"\n=== Testing Query ===")
org_id = "12"
own_org_id = int(org_id)
owner_ids = set([own_org_id])

query_filter = Q()
query_filter &= (Q(organization_id__in=owner_ids) | Q(inventory_owner_organization_id__in=owner_ids))
query_filter &= Q(is_active=True)

queryset = UmrahPackage.objects.filter(query_filter)
print(f"Before date filter: {queryset.count()} packages")

# Apply the date exclusion
now = timezone.now()
queryset = queryset.exclude(ticket_details__ticket__trip_details__departure_date_time__lt=now)
print(f"After date filter: {queryset.count()} packages")

if queryset.count() == 0:
    print("\n❌ Package filtered out due to past departure dates!")
else:
    print("\n✅ Package should appear in results")
