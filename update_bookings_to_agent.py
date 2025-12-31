"""
Update bookings to use the correct agent user so they appear in agent panel.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from organization.models import Organization
from django.contrib.auth.models import User

org = Organization.objects.get(id=11)

# Get the agent user
agent_user = User.objects.filter(id=52).first()

if not agent_user:
    print("❌ Agent user (ID: 52) not found!")
    exit(1)

print("="*80)
print("UPDATING BOOKINGS TO AGENT USER")
print("="*80)
print(f"\nAgent: {agent_user.username} ({agent_user.email})")
print(f"Agency ID: 41, Branch ID: 46")

# Get all bookings
bookings = Booking.objects.filter(organization=org).order_by('-id')[:6]
print(f"\nFound {bookings.count()} bookings to update")

for booking in bookings:
    print(f"\n  Booking #{booking.id} - {booking.booking_number}")
    print(f"    Old user: {booking.user.username if booking.user else 'None'}")
    
    # Update to agent user
    booking.user = agent_user
    booking.save(update_fields=['user'])
    
    print(f"    ✅ New user: {agent_user.username}")

print(f"\n{'='*80}")
print("✅ ALL BOOKINGS UPDATED TO AGENT USER!")
print(f"{'='*80}")
print("\nBookings should now appear in agent panel booking history!")
