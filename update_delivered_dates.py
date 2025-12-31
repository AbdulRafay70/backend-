"""
Update hotel check-in dates for delivered bookings to today's date.
"""
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

today = date.today()
print(f"Updating delivered bookings to have check-in date: {today}")
print("=" * 60)

# Get delivered bookings
delivered_bookings = Booking.objects.filter(status='Delivered')

for booking in delivered_bookings:
    print(f"\nBooking: {booking.booking_number}")
    
    # Update hotel details
    hotel_details = booking.hotel_details.all()
    if hotel_details.exists():
        for hotel in hotel_details:
            old_checkin = hotel.check_in_date
            hotel.check_in_date = today
            hotel.save()
            print(f"  ✅ Updated hotel check-in: {old_checkin} → {today}")
    else:
        print(f"  ⚠️  No hotel details found")
    
    # Update transport sector dates if any
    transport_details = booking.transport_details.all()
    for transport in transport_details:
        sectors = transport.sector_details.all()
        for sector in sectors:
            if sector.date:
                old_date = sector.date
                sector.date = today
                sector.save()
                print(f"  ✅ Updated transport sector date: {old_date} → {today}")

print("\n" + "=" * 60)
print("✅ Update complete! Delivered bookings should now appear in Daily Operations.")
