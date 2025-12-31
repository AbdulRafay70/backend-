"""
Check what category/booking_type field the bookings have.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from organization.models import Organization

org = Organization.objects.get(id=11)

booking = Booking.objects.filter(organization=org).first()

if booking:
    print("="*80)
    print(f"BOOKING FIELDS CHECK: {booking.booking_number}")
    print("="*80)
    print(f"\nbooking_type: {booking.booking_type}")
    print(f"category: {booking.category if hasattr(booking, 'category') else 'NO CATEGORY FIELD'}")
    print(f"umrah_package: {booking.umrah_package.id if booking.umrah_package else 'None'}")
    print(f"is_full_package: {booking.is_full_package if hasattr(booking, 'is_full_package') else 'NO FIELD'}")
    
    print(f"\n{'='*80}")
    print("RECOMMENDATION:")
    print("The frontend should filter by:")
    print(f"  booking.booking_type === 'UMRAH'")
    print("OR")
    print(f"  booking.umrah_package !== null")
    print("="*80)
else:
    print("No bookings found!")
