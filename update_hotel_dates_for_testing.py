import os
import sys
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saerpk.settings')

import django
django.setup()

from booking.models import Booking, BookingHotelDetails

# Get all approved/delivered bookings
bookings = Booking.objects.filter(status__in=['Approved', 'Delivered'])

print("\n" + "="*80)
print("UPDATING HOTEL DATES FOR TESTING PASSENGER MOVEMENTS")
print("="*80)

today = datetime.now().date()
print(f"\nToday's date: {today}")

# We'll update different bookings to different statuses:
# - Some in Makkah (currently checked in)
# - Some in Madinah (currently checked in)
# - Some in flight (check-in today)
# - Some exit pending (check-out today)
# - Some exited (check-out in past)

booking_count = 0
for booking in bookings[:10]:  # Update first 10 bookings
    hotel_details = booking.hotel_details.all()
    
    if not hotel_details:
        print(f"\n❌ Booking {booking.booking_number}: No hotel details")
        continue
    
    booking_count += 1
    
    # Distribute bookings across different statuses
    if booking_count <= 3:
        # In Makkah (checked in 3 days ago, checking out in 7 days)
        status = "In Makkah"
        check_in = today - timedelta(days=3)
        check_out = today + timedelta(days=7)
        city_name = "Makkah"
    elif booking_count <= 5:
        # In Madinah (checked in 2 days ago, checking out in 5 days)
        status = "In Madinah"
        check_in = today - timedelta(days=2)
        check_out = today + timedelta(days=5)
        city_name = "Madinah"
    elif booking_count <= 7:
        # In Flight (check-in today)
        status = "In Flight"
        check_in = today
        check_out = today + timedelta(days=10)
        city_name = "Makkah"
    elif booking_count <= 8:
        # Exit Pending (check-out today)
        status = "Exit Pending"
        check_in = today - timedelta(days=10)
        check_out = today
        city_name = "Jeddah"
    else:
        # Exited KSA (check-out yesterday)
        status = "Exited KSA"
        check_in = today - timedelta(days=15)
        check_out = today - timedelta(days=1)
        city_name = "Makkah"
    
    print(f"\n📦 Booking {booking.booking_number} → {status}")
    print(f"   Passengers: {booking.person_details.count()}")
    
    # Update all hotel details for this booking
    for hd in hotel_details:
        old_check_in = hd.check_in_date
        old_check_out = hd.check_out_date
        
        hd.check_in_date = check_in
        hd.check_out_date = check_out
        hd.save()
        
        # Update hotel city if needed
        if hd.hotel and hd.hotel.city:
            hotel_city = hd.hotel.city.name if hasattr(hd.hotel.city, 'name') else str(hd.hotel.city)
            print(f"   🏨 {hd.hotel.name} ({hotel_city})")
            print(f"      Check-in: {old_check_in} → {check_in}")
            print(f"      Check-out: {old_check_out} → {check_out}")

print("\n" + "="*80)
print("SUMMARY")
print("="*80)

# Count expected distribution
in_makkah = 0
in_madinah = 0
in_flight = 0
exit_pending = 0
exited = 0

for booking in bookings[:10]:
    person_count = booking.person_details.filter(visa_status='Approved').count()
    
    if booking_count <= 3:
        in_makkah += person_count
    elif booking_count <= 5:
        in_madinah += person_count
    elif booking_count <= 7:
        in_flight += person_count
    elif booking_count <= 8:
        exit_pending += person_count
    else:
        exited += person_count

print(f"\nExpected Distribution:")
print(f"   🕋 In Makkah: ~{in_makkah} passengers")
print(f"   🕌 In Madinah: ~{in_madinah} passengers")
print(f"   ✈️  In Flight: ~{in_flight} passengers")
print(f"   ⏳ Exit Pending: ~{exit_pending} passengers")
print(f"   ✅ Exited KSA: ~{exited} passengers")

print("\n✅ Hotel dates updated successfully!")
print("🔄 Refresh the Passenger Movements page to see the changes.")
print("\n" + "="*80)
