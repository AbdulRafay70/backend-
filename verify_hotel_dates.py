from datetime import datetime
from booking.models import Booking, BookingHotelDetails

# Check the actual dates in the database
bookings = Booking.objects.filter(
    booking_number__in=['PKG93849', 'PKG39037', 'PKG54596', 'PKG46211', 'PKG25254']
).prefetch_related('hotel_details__hotel__city')

print("\n" + "="*80)
print("VERIFYING HOTEL DATES IN DATABASE")
print("="*80)
print(f"Current time: {datetime.now()}")
print()

for booking in bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    hotel_details = booking.hotel_details.all()
    
    if not hotel_details:
        print("   ❌ No hotel details")
        continue
    
    for hd in hotel_details:
        city_name = hd.hotel.city.name if hd.hotel and hd.hotel.city and hasattr(hd.hotel.city, 'name') else 'Unknown'
        print(f"   🏨 {hd.hotel.name if hd.hotel else 'Unknown'} ({city_name})")
        print(f"      Check-in: {hd.check_in_date}")
        print(f"      Check-out: {hd.check_out_date}")

print("\n" + "="*80)
