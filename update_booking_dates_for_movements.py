"""
Update booking details to test passenger movements:
- Set varied check-in dates (some today, some past, some future)
- This will make passengers appear in different movement statuses
- No model changes needed - frontend will sort automatically
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

def update_booking_dates_for_movements():
    """Update booking dates to create varied passenger movement scenarios"""
    
    print("=" * 80)
    print("UPDATING BOOKING DATES FOR PASSENGER MOVEMENTS")
    print("=" * 80)
    
    today = datetime.now().date()
    
    # Get all delivered bookings
    bookings = list(Booking.objects.filter(status='Delivered').order_by('-id'))
    
    print(f"\n📅 Today: {today}")
    print(f"📋 Total Delivered Bookings: {len(bookings)}\n")
    
    # Scenario 1: Passengers in Pakistan (check-in in future)
    print("🇵🇰 Setting 3 bookings with FUTURE check-ins (In Pakistan)...")
    for i, booking in enumerate(bookings[:3]):
        future_date = today + timedelta(days=i+5)
        for hotel in booking.hotel_details.all():
            hotel.check_in_date = future_date
            hotel.check_out_date = future_date + timedelta(days=hotel.number_of_nights)
            hotel.check_in_status = 'inactive'
            hotel.save()
        print(f"   ✅ {booking.booking_number}: Check-in {future_date} ({booking.total_pax} pax)")
    
    # Scenario 2: Passengers in Flight (check-in today)
    print(f"\n✈️  Setting 2 bookings with TODAY check-in (In Flight)...")
    for i, booking in enumerate(bookings[3:5]):
        for hotel in booking.hotel_details.all():
            hotel.check_in_date = today
            hotel.check_out_date = today + timedelta(days=hotel.number_of_nights)
            hotel.check_in_status = 'active'
            hotel.save()
        print(f"   ✅ {booking.booking_number}: Check-in TODAY ({booking.total_pax} pax)")
    
    # Scenario 3: Passengers in Makkah (checked in 1-3 days ago, Makkah hotel)
    print(f"\n🕋 Setting 3 bookings IN MAKKAH (checked in recently)...")
    for i, booking in enumerate(bookings[5:8]):
        past_date = today - timedelta(days=i+1)
        for hotel in booking.hotel_details.all():
            if hotel.leg_no == 1:  # First hotel (Makkah)
                hotel.check_in_date = past_date
                hotel.check_out_date = past_date + timedelta(days=hotel.number_of_nights)
                hotel.check_in_status = 'active'
                hotel.check_out_status = 'inactive'
            else:  # Second hotel (Madinah) - future
                hotel.check_in_date = today + timedelta(days=7)
                hotel.check_out_date = hotel.check_in_date + timedelta(days=hotel.number_of_nights)
                hotel.check_in_status = 'inactive'
            hotel.save()
        print(f"   ✅ {booking.booking_number}: In Makkah since {past_date} ({booking.total_pax} pax)")
    
    # Scenario 4: Passengers in Madinah (Makkah completed, in Madinah now)
    print(f"\n🕌 Setting 2 bookings IN MADINAH (moved from Makkah)...")
    for i, booking in enumerate(bookings[8:10]):
        makkah_checkin = today - timedelta(days=10)
        makkah_checkout = today - timedelta(days=3)
        madinah_checkin = today - timedelta(days=2)
        
        for hotel in booking.hotel_details.all():
            if hotel.leg_no == 1:  # Makkah - completed
                hotel.check_in_date = makkah_checkin
                hotel.check_out_date = makkah_checkout
                hotel.check_in_status = 'active'
                hotel.check_out_status = 'active'
            else:  # Madinah - current
                hotel.check_in_date = madinah_checkin
                hotel.check_out_date = madinah_checkin + timedelta(days=hotel.number_of_nights)
                hotel.check_in_status = 'active'
                hotel.check_out_status = 'inactive'
            hotel.save()
        print(f"   ✅ {booking.booking_number}: In Madinah since {madinah_checkin} ({booking.total_pax} pax)")
    
    # Scenario 5: Exit Pending (all hotels completed, return soon)
    print(f"\n⏳ Setting 2 bookings EXIT PENDING (hotels completed)...")
    for i, booking in enumerate(bookings[10:12]):
        checkout_date = today - timedelta(days=1)
        
        for hotel in booking.hotel_details.all():
            hotel.check_in_date = today - timedelta(days=14)
            hotel.check_out_date = checkout_date
            hotel.check_in_status = 'active'
            hotel.check_out_status = 'active'
            hotel.save()
        print(f"   ✅ {booking.booking_number}: Exit pending (checked out {checkout_date}) ({booking.total_pax} pax)")
    
    # Scenario 6: Exited KSA (returned to Pakistan)
    print(f"\n✅ Setting 1 booking EXITED (returned to Pakistan)...")
    if len(bookings) > 12:
        booking = bookings[12]
        exit_date = today - timedelta(days=2)
        
        for hotel in booking.hotel_details.all():
            hotel.check_in_date = today - timedelta(days=20)
            hotel.check_out_date = exit_date
            hotel.check_in_status = 'active'
            hotel.check_out_status = 'active'
            hotel.save()
        print(f"   ✅ {booking.booking_number}: Exited on {exit_date} ({booking.total_pax} pax)")
    
    print(f"\n{'='*80}")
    print("✅ BOOKING DATES UPDATED!")
    print(f"{'='*80}")
    
    # Summary
    print(f"\n📊 PASSENGER MOVEMENT SUMMARY:")
    print(f"\n   Based on check-in dates, passengers will be categorized as:")
    print(f"   🇵🇰 In Pakistan:     ~9 pax (future check-ins)")
    print(f"   ✈️  In Flight:        ~4-6 pax (checking in today)")
    print(f"   🕋 In Makkah:        ~9-12 pax (checked into Makkah hotel)")
    print(f"   🕌 In Madinah:       ~4-6 pax (checked into Madinah hotel)")
    print(f"   ⏳ Exit Pending:     ~4-6 pax (all hotels checked out)")
    print(f"   ✅ Exited KSA:       ~1-3 pax (returned)")
    
    print(f"\n{'='*80}")
    print("🎉 PASSENGER MOVEMENTS READY FOR TESTING!")
    print(f"{'='*80}")
    print(f"\n💡 The frontend will automatically sort passengers based on:")
    print(f"   - Check-in dates (past/present/future)")
    print(f"   - Hotel locations (Makkah/Madinah)")
    print(f"   - Check-out status")
    print(f"\n🔄 Refresh the Passenger Movements page to see the updated distribution!")

if __name__ == '__main__':
    update_booking_dates_for_movements()
