import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saerpk.settings')

import django
django.setup()

from booking.models import BookingHotelDetails, Booking
from datetime import datetime

# Get all bookings with hotel details
bookings = Booking.objects.filter(
    status__in=['Approved', 'Delivered']
).prefetch_related('hotel_details__hotel__city')

print("\n" + "="*80)
print("DEBUGGING HOTEL CITY DATA")
print("="*80)

total_hotels = 0
for booking in bookings:
    hotel_details = booking.hotel_details.all()
    if hotel_details:
        print(f"\n📦 Booking: {booking.booking_number}")
        for hd in hotel_details:
            if hd.hotel:
                total_hotels += 1
                city = hd.hotel.city
                print(f"   🏨 Hotel: {hd.hotel.name}")
                print(f"   📍 City Object: {city}")
                print(f"   📍 City Type: {type(city)}")
                if city:
                    print(f"   📍 City Name: {city.name if hasattr(city, 'name') else 'NO NAME ATTRIBUTE'}")
                    if hasattr(city, 'name'):
                        print(f"   📍 City Name (lowercase): {city.name.lower()}")
                print(f"   📅 Check-in: {hd.check_in_date}")
                print(f"   📅 Check-out: {hd.check_out_date}")
                
                # Check if passenger should be in this hotel today
                if hd.check_in_date and hd.check_out_date:
                    today = datetime.now().date()
                    if hd.check_in_date <= today <= hd.check_out_date:
                        print(f"   ✅ PASSENGER SHOULD BE HERE TODAY!")
                print()

print("\n" + "="*80)
print("SUMMARY")
print("="*80)

# Count hotels by city
from collections import Counter
city_counts = Counter()

for booking in bookings:
    for hd in booking.hotel_details.all():
        if hd.hotel and hd.hotel.city:
            city_name = hd.hotel.city.name if hasattr(hd.hotel.city, 'name') else str(hd.hotel.city)
            city_counts[city_name] += 1

print(f"\nTotal Hotels: {total_hotels}")
print("\nHotels by City:")
for city, count in city_counts.items():
    print(f"   {city}: {count} hotels")

print("\n" + "="*80)
