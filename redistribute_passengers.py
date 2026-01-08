"""
Update booking dates to create proper distribution:
- Some passengers in Madinah
- Some passengers in Exit Pending
- Fix the "In KSA" generic status to show specific cities
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from tickets.models import Hotels

def update_for_better_distribution():
    """Update bookings to show passengers in all statuses"""
    
    print("=" * 80)
    print("UPDATING FOR COMPLETE PASSENGER DISTRIBUTION")
    print("=" * 80)
    
    today = datetime.now().date()
    print(f"\n📅 Today: {today}\n")
    
    # Get Madinah hotels
    madinah_hotels = Hotels.objects.filter(city__name='Madinah', is_active=True)
    print(f"📍 Madinah hotels available: {madinah_hotels.count()}")
    
    delivered_bookings = list(Booking.objects.filter(status='Delivered').order_by('-id'))
    
    # Scenario 1: Move 2 bookings to Madinah (currently in Makkah)
    print(f"\n🕌 Setting 2 bookings to MADINAH...")
    madinah_bookings = delivered_bookings[8:10]  # PKG53895, PKG35122
    
    for booking in madinah_bookings:
        pax_count = booking.person_details.filter(visa_status='Approved').count()
        
        # Update second hotel to be currently active (Madinah)
        for hotel_detail in booking.hotel_details.all():
            if hotel_detail.leg_no == 2:  # Second hotel (Madinah)
                # Set Madinah hotel as current
                hotel_detail.check_in_date = today - timedelta(days=2)
                hotel_detail.check_out_date = today + timedelta(days=5)
                hotel_detail.check_in_status = 'active'
                hotel_detail.check_out_status = 'inactive'
                hotel_detail.save()
                print(f"   ✅ {booking.booking_number}: In {hotel_detail.hotel.name} (Madinah) ({pax_count} pax)")
            elif hotel_detail.leg_no == 1:  # First hotel (Makkah) - completed
                hotel_detail.check_in_date = today - timedelta(days=10)
                hotel_detail.check_out_date = today - timedelta(days=3)
                hotel_detail.check_in_status = 'active'
                hotel_detail.check_out_status = 'active'
                hotel_detail.save()
    
    # Scenario 2: Set 2 bookings to EXIT PENDING (all hotels checked out today)
    print(f"\n⏳ Setting 2 bookings to EXIT PENDING...")
    exit_pending_bookings = delivered_bookings[10:12]  # PKG59441, CUS24664
    
    for booking in exit_pending_bookings:
        pax_count = booking.person_details.filter(visa_status='Approved').count()
        
        # Set all hotels as checked out today
        for hotel_detail in booking.hotel_details.all():
            hotel_detail.check_in_date = today - timedelta(days=14)
            hotel_detail.check_out_date = today  # Checking out TODAY
            hotel_detail.check_in_status = 'active'
            hotel_detail.check_out_status = 'active'
            hotel_detail.save()
        
        print(f"   ✅ {booking.booking_number}: Exit pending ({pax_count} pax)")
    
    # Scenario 3: Keep remaining in Makkah but ensure they're properly dated
    print(f"\n🕋 Ensuring Makkah passengers are properly set...")
    makkah_bookings = delivered_bookings[5:8]  # CUS54436, PKG83719, PKG51253
    
    for booking in makkah_bookings:
        pax_count = booking.person_details.filter(visa_status='Approved').count()
        
        # Ensure first hotel (Makkah) is currently active
        for hotel_detail in booking.hotel_details.all():
            if hotel_detail.leg_no == 1:  # First hotel (Makkah)
                hotel_detail.check_in_date = today - timedelta(days=random.randint(1, 3))
                hotel_detail.check_out_date = today + timedelta(days=random.randint(5, 10))
                hotel_detail.check_in_status = 'active'
                hotel_detail.check_out_status = 'inactive'
                hotel_detail.save()
                print(f"   ✅ {booking.booking_number}: In {hotel_detail.hotel.name} (Makkah) ({pax_count} pax)")
    
    print(f"\n{'='*80}")
    print("✅ DISTRIBUTION UPDATED!")
    print(f"{'='*80}")
    
    # Summary
    print(f"\n📊 EXPECTED DISTRIBUTION:")
    print(f"   🇵🇰 In Pakistan:  ~14 passengers (future check-ins)")
    print(f"   ✈️  In Flight:     ~10 passengers (checking in today)")
    print(f"   🕋 In Makkah:     ~12 passengers (in Makkah hotels)")
    print(f"   🕌 In Madinah:    ~5 passengers (in Madinah hotels)")
    print(f"   ⏳ Exit Pending:  ~4 passengers (checked out today)")
    print(f"   ✅ Exited KSA:    ~5 passengers (checked out in past)")
    print(f"\n🔄 Refresh the Passenger Movements page to see the updated distribution!")

import random

if __name__ == '__main__':
    update_for_better_distribution()
