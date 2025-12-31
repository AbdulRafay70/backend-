"""
Check transport details for bookings.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("CHECKING TRANSPORT DATA")
print("="*80)

bookings = Booking.objects.filter(organization=org).order_by('-id')[:6]

for booking in bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    transport_count = booking.transport_details.count()
    print(f"  Transport count: {transport_count}")
    for t in booking.transport_details.all():
        vehicle = t.vehicle_type.vehicle_name if t.vehicle_type else "N/A"
        print(f"    - Vehicle: {vehicle}, PKR: {t.price_in_pkr}")

print(f"\n{'='*80}")
