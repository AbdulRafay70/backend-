from datetime import datetime
from booking.models import Booking, BookingHotelDetails

# Get ALL approved/delivered bookings and show their dates
bookings = Booking.objects.filter(
    status__in=['Approved', 'Delivered']
).prefetch_related('hotel_details__hotel__city').order_by('booking_number')

print("\n" + "="*80)
print("ALL BOOKING HOTEL DATES")
print("="*80)
print(f"Today: {datetime.now().date()}\n")

for booking in bookings:
    hotel_details = list(booking.hotel_details.all())
    
    if not hotel_details:
        continue
    
    # Get first hotel check-in date
    first_checkin = min([hd.check_in_date for hd in hotel_details if hd.check_in_date])
    
    print(f"{booking.booking_number}: Check-in {first_checkin}")
    for hd in hotel_details:
        city_name = hd.hotel.city.name if hd.hotel and hd.hotel.city and hasattr(hd.hotel.city, 'name') else 'Unknown'
        print(f"   - {hd.hotel.name if hd.hotel else 'Unknown'} ({city_name}): {hd.check_in_date} to {hd.check_out_date}")

print("\n" + "="*80)
