"""
Add food and ziyarat details to bookings.
"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingFoodDetails, BookingZiyaratDetails
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("ADDING FOOD AND ZIYARAT DETAILS TO BOOKINGS")
print("="*80)

# Get bookings
bookings = Booking.objects.filter(
    organization=org,
    umrah_package__isnull=False
).order_by('-id')[:6]

print(f"\nFound {bookings.count()} bookings")

for booking in bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    print(f"   Total Pax: {booking.total_pax} (Adults: {booking.total_adult}, Children: {booking.total_child}, Infants: {booking.total_infant})")
    
    # Add food details if not exists
    existing_food = BookingFoodDetails.objects.filter(booking=booking).count()
    if existing_food == 0:
        # Add breakfast
        BookingFoodDetails.objects.create(
            booking=booking,
            food='Breakfast',
            adult_price=30,
            child_price=20,
            infant_price=0,
            total_adults=booking.total_adult,
            total_children=booking.total_child,
            total_infants=booking.total_infant,
            is_price_pkr=True,
            riyal_rate=78.75,
            total_price_pkr=(booking.total_adult * 30) + (booking.total_child * 20),
            total_price_sar=((booking.total_adult * 30) + (booking.total_child * 20)) / 78.75
        )
        # Add lunch
        BookingFoodDetails.objects.create(
            booking=booking,
            food='Lunch',
            adult_price=50,
            child_price=35,
            infant_price=0,
            total_adults=booking.total_adult,
            total_children=booking.total_child,
            total_infants=booking.total_infant,
            is_price_pkr=True,
            riyal_rate=78.75,
            total_price_pkr=(booking.total_adult * 50) + (booking.total_child * 35),
            total_price_sar=((booking.total_adult * 50) + (booking.total_child * 35)) / 78.75
        )
        print(f"   ✅ Added 2 food items")
    else:
        print(f"   ℹ️  Already has {existing_food} food items")
    
    # Add ziyarat details if not exists
    existing_ziyarat = BookingZiyaratDetails.objects.filter(booking=booking).count()
    if existing_ziyarat == 0:
        # Add Makkah ziyarat
        BookingZiyaratDetails.objects.create(
            booking=booking,
            ziarat='Makkah Historical Places',
            city='Makkah',
            adult_price=150,
            child_price=100,
            infant_price=0,
            total_adults=booking.total_adult,
            total_children=booking.total_child,
            total_infants=booking.total_infant,
            is_price_pkr=True,
            riyal_rate=78.75,
            total_price_pkr=(booking.total_adult * 150) + (booking.total_child * 100),
            total_price_sar=((booking.total_adult * 150) + (booking.total_child * 100)) / 78.75,
            date=date.today() + timedelta(days=5)
        )
        # Add Madinah ziyarat
        BookingZiyaratDetails.objects.create(
            booking=booking,
            ziarat='Madinah Historical Places',
            city='Madinah',
            adult_price=120,
            child_price=80,
            infant_price=0,
            total_adults=booking.total_adult,
            total_children=booking.total_child,
            total_infants=booking.total_infant,
            is_price_pkr=True,
            riyal_rate=78.75,
            total_price_pkr=(booking.total_adult * 120) + (booking.total_child * 80),
            total_price_sar=((booking.total_adult * 120) + (booking.total_child * 80)) / 78.75,
            date=date.today() + timedelta(days=12)
        )
        print(f"   ✅ Added 2 ziyarat items")
    else:
        print(f"   ℹ️  Already has {existing_ziyarat} ziyarat items")

print(f"\n{'='*80}")
print("✅ FOOD AND ZIYARAT DETAILS ADDED!")
print("="*80)
