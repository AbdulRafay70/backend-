"""
Check if the 6 new bookings are being returned by the API for the agent.
"""
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from organization.models import Organization
from django.contrib.auth.models import User

org = Organization.objects.get(id=11)
agent_user = User.objects.get(id=52)

print("="*80)
print("CHECKING BOOKINGS FOR AGENT")
print("="*80)
print(f"\nAgent: {agent_user.username} (ID: {agent_user.id})")
print(f"Organization: {org.id}")

# Get bookings from database
db_bookings = Booking.objects.filter(
    organization=org,
    user=agent_user
).order_by('-id')

print(f"\n📊 DATABASE BOOKINGS FOR AGENT:")
print(f"Total: {db_bookings.count()}")

for booking in db_bookings[:10]:
    print(f"\n  {booking.booking_number}")
    print(f"    User: {booking.user.username}")
    print(f"    Type: {booking.booking_type}")
    print(f"    Package: {booking.umrah_package.title if booking.umrah_package else 'None'}")
    print(f"    Date: {booking.date}")
    print(f"    Status: {booking.status}")

# Check our newly created bookings specifically
print(f"\n{'='*80}")
print("CHECKING OUR 6 NEW BOOKINGS:")
print("="*80)

new_bookings = Booking.objects.filter(
    booking_number__startswith='BK-20251228-'
).order_by('-id')

print(f"Found: {new_bookings.count()}")

for booking in new_bookings:
    print(f"\n  {booking.booking_number}")
    print(f"    User: {booking.user.username} (ID: {booking.user.id})")
    print(f"    Agency: {booking.agency.id if booking.agency else 'None'}")
    print(f"    Branch: {booking.branch.id if booking.branch else 'None'}")
    print(f"    Type: {booking.booking_type}")
    print(f"    Package: {booking.umrah_package.title if booking.umrah_package else 'None'}")

print(f"\n{'='*80}")
if new_bookings.count() > 0:
    first = new_bookings.first()
    if first.user.id != 52:
        print("❌ ISSUE: Bookings are not assigned to agent user (52)")
        print(f"   They are assigned to: {first.user.username} (ID: {first.user.id})")
    else:
        print("✅ Bookings are correctly assigned to agent user")
