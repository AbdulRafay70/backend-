"""
Update ziyarat dates for delivered bookings to today's date.
"""
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

today = date.today()
print(f"Updating ziyarat dates to: {today}")
print("=" * 60)

# Get delivered bookings
delivered_bookings = Booking.objects.filter(status='Delivered')

for booking in delivered_bookings:
    print(f"\nBooking: {booking.booking_number}")
    
    # Update ziyarat details
    ziyarat_details = booking.ziyarat_details.all()
    if ziyarat_details.exists():
        for ziyarat in ziyarat_details:
            old_date = ziyarat.date
            ziyarat.date = today
            ziyarat.save()
            print(f"  ✅ Updated ziyarat '{ziyarat.ziarat}' in {ziyarat.city}: {old_date} → {today}")
    else:
        print(f"  ⚠️  No ziyarat details found")

print("\n" + "=" * 60)
print("✅ Ziyarat dates updated successfully!")
