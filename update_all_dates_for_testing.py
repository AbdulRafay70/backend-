"""
Update all dates for delivered bookings to today (2025-12-30) for testing.
"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

today = date.today()
print(f"Updating all dates to: {today}")
print("=" * 60)

# Get delivered bookings
delivered_bookings = Booking.objects.filter(status='Delivered')

for booking in delivered_bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    
    # Update hotel details
    hotel_details = booking.hotel_details.all()
    for hotel in hotel_details:
        old_checkin = hotel.check_in_date
        old_checkout = hotel.check_out_date
        hotel.check_in_date = today
        hotel.check_out_date = today + timedelta(days=3)
        hotel.save()
        print(f"  🏨 Hotel: {old_checkin} → {today} (check-in)")
        print(f"       {old_checkout} → {today + timedelta(days=3)} (check-out)")
    
    # Update ziyarat details
    ziyarat_details = booking.ziyarat_details.all()
    for ziyarat in ziyarat_details:
        old_date = ziyarat.date
        ziyarat.date = today
        ziyarat.save()
        print(f"  🕌 Ziyarat '{ziyarat.ziarat}': {old_date} → {today}")
    
    # Update transport sector dates
    transport_details = booking.transport_details.all()
    for transport in transport_details:
        sectors = transport.sector_details.all()
        for sector in sectors:
            if sector.date:
                old_date = sector.date
                sector.date = today
                sector.save()
                print(f"  🚗 Transport sector: {old_date} → {today}")

print("\n" + "=" * 60)
print(f"✅ All dates updated to {today}!")
print("You can now test the status updates in Daily Operations.")
