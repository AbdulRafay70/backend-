"""
Check for bookings with Delivered status in the database.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from datetime import date

print("=" * 60)
print("CHECKING FOR DELIVERED BOOKINGS")
print("=" * 60)

# Check all bookings
all_bookings = Booking.objects.all()
print(f"\nTotal bookings in database: {all_bookings.count()}")

# Check delivered bookings
delivered_bookings = Booking.objects.filter(status='Delivered')
print(f"Bookings with 'Delivered' status: {delivered_bookings.count()}")

# Show all unique statuses
statuses = Booking.objects.values_list('status', flat=True).distinct()
print(f"\nAll unique booking statuses in database:")
for status in statuses:
    count = Booking.objects.filter(status=status).count()
    print(f"  - {status}: {count} bookings")

# If no delivered bookings, show some sample bookings
if delivered_bookings.count() == 0:
    print("\n" + "=" * 60)
    print("NO DELIVERED BOOKINGS FOUND!")
    print("=" * 60)
    print("\nShowing first 5 bookings with their statuses:")
    for booking in all_bookings[:5]:
        print(f"  - {booking.booking_number}: {booking.status}")
    
    print("\n💡 TIP: You need to change some booking statuses to 'Delivered'")
    print("   to see them on the Daily Operations page.")
else:
    print("\n" + "=" * 60)
    print(f"FOUND {delivered_bookings.count()} DELIVERED BOOKINGS")
    print("=" * 60)
    for booking in delivered_bookings[:10]:
        print(f"\n  Booking: {booking.booking_number}")
        print(f"  Status: {booking.status}")
        print(f"  Date: {booking.date}")
        if booking.hotel_details.exists():
            hotel = booking.hotel_details.first()
            hotel_name = getattr(hotel, 'hotel_name', None) or getattr(hotel, 'self_hotel_name', 'N/A')
            print(f"  Hotel: {hotel_name}")
            print(f"  Check-in: {hotel.check_in_date}")
