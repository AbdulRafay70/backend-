from datetime import datetime, timedelta
from booking.models import Booking, BookingHotelDetails

# Get all approved/delivered bookings
bookings = Booking.objects.filter(status__in=['Approved', 'Delivered']).prefetch_related('hotel_details__hotel__city', 'person_details')

print("\n" + "="*80)
print("UPDATING HOTEL DATES FOR TESTING PASSENGER MOVEMENTS")
print("="*80)

today = datetime.now().date()
print(f"\nToday's date: {today}")

# We'll update different bookings to different statuses
booking_count = 0
updates = []

for booking in bookings[:10]:  # Update first 10 bookings
    hotel_details = list(booking.hotel_details.all())
    
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
    elif booking_count <= 5:
        # In Madinah (checked in 2 days ago, checking out in 5 days)
        status = "In Madinah"
        check_in = today - timedelta(days=2)
        check_out = today + timedelta(days=5)
    elif booking_count <= 7:
        # In Flight (check-in today)
        status = "In Flight"
        check_in = today
        check_out = today + timedelta(days=10)
    elif booking_count <= 8:
        # Exit Pending (check-out today)
        status = "Exit Pending"
        check_in = today - timedelta(days=10)
        check_out = today
    else:
        # Exited KSA (check-out yesterday)
        status = "Exited KSA"
        check_in = today - timedelta(days=15)
        check_out = today - timedelta(days=1)
    
    person_count = booking.person_details.filter(visa_status='Approved').count()
    print(f"\n📦 Booking {booking.booking_number} → {status} ({person_count} passengers)")
    
    # Update all hotel details for this booking
    for hd in hotel_details:
        old_check_in = hd.check_in_date
        old_check_out = hd.check_out_date
        
        hd.check_in_date = check_in
        hd.check_out_date = check_out
        hd.save()
        
        hotel_city = hd.hotel.city.name if hd.hotel and hd.hotel.city and hasattr(hd.hotel.city, 'name') else 'Unknown'
        print(f"   🏨 {hd.hotel.name if hd.hotel else 'Unknown'} ({hotel_city})")
        print(f"      {old_check_in} → {check_in} to {check_out}")
        
        updates.append((booking.booking_number, status, person_count))

print("\n" + "="*80)
print("SUMMARY")
print("="*80)

# Group by status
from collections import defaultdict
status_counts = defaultdict(int)
for _, status, count in updates:
    status_counts[status] += count

print(f"\nExpected Distribution:")
for status, count in sorted(status_counts.items()):
    print(f"   {status}: {count} passengers")

print("\n✅ Hotel dates updated successfully!")
print("🔄 Refresh the Passenger Movements page to see the changes.")
print("\n" + "="*80)
