"""
Update bookings for daily operations:
- Set some bookings to 'Delivered' status
- Set check-in dates to today and next few days
- Ensure they appear in daily operations
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

def update_for_daily_operations():
    """Update bookings to appear in daily operations"""
    
    print("=" * 80)
    print("UPDATING BOOKINGS FOR DAILY OPERATIONS")
    print("=" * 80)
    
    today = datetime.now().date()
    
    print(f"\n📅 Today's Date: {today}")
    print(f"📅 Setting up bookings for the next 7 days...")
    
    # Get all bookings
    bookings = list(Booking.objects.all().order_by('-id'))
    
    # Update first 10 bookings to have activities in the next 7 days
    for i, booking in enumerate(bookings[:15]):
        # Set different dates for variety
        days_offset = i % 7  # 0-6 days from today
        check_in_date = today + timedelta(days=days_offset)
        
        print(f"\n{'='*80}")
        print(f"📋 {booking.booking_number}")
        print(f"{'='*80}")
        
        # Set booking status to 'Delivered'
        old_status = booking.status
        booking.status = 'Delivered'
        booking.save()
        print(f"   📊 Status: {old_status} → Delivered")
        
        # Update hotel check-in dates
        hotel_count = 0
        for hotel_detail in booking.hotel_details.all():
            if hotel_detail.leg_no == 1:  # First hotel
                hotel_detail.check_in_date = check_in_date
                hotel_detail.check_out_date = check_in_date + timedelta(days=hotel_detail.number_of_nights)
            else:  # Second hotel
                hotel_detail.check_in_date = check_in_date + timedelta(days=7)
                hotel_detail.check_out_date = hotel_detail.check_in_date + timedelta(days=hotel_detail.number_of_nights)
            
            # Set check-in status to active for today's check-ins
            if hotel_detail.check_in_date == today:
                hotel_detail.check_in_status = 'active'
            elif hotel_detail.check_out_date == today:
                hotel_detail.check_out_status = 'active'
            
            hotel_detail.save()
            hotel_count += 1
            
            print(f"   🏨 {hotel_detail.hotel.name if hotel_detail.hotel else 'Hotel'}")
            print(f"      Check-in: {hotel_detail.check_in_date}")
            print(f"      Check-out: {hotel_detail.check_out_date}")
        
        if hotel_count > 0:
            print(f"   ✅ Updated {hotel_count} hotel(s)")
    
    print(f"\n{'='*80}")
    print("✅ BOOKINGS UPDATED FOR DAILY OPERATIONS!")
    print(f"{'='*80}")
    
    # Summary
    print(f"\n📊 SUMMARY:")
    
    delivered_count = Booking.objects.filter(status='Delivered').count()
    print(f"   Total 'Delivered' bookings: {delivered_count}")
    
    # Count bookings by date for next 7 days
    print(f"\n   📅 Bookings by Check-in Date (Next 7 Days):")
    for i in range(7):
        date = today + timedelta(days=i)
        count = Booking.objects.filter(
            status='Delivered',
            hotel_details__check_in_date=date
        ).distinct().count()
        
        if count > 0:
            day_name = date.strftime('%A')
            print(f"   - {date} ({day_name}): {count} booking(s)")
    
    # Today's activities
    print(f"\n   🎯 TODAY'S ACTIVITIES ({today}):")
    
    check_ins_today = Booking.objects.filter(
        status='Delivered',
        hotel_details__check_in_date=today
    ).distinct().count()
    
    check_outs_today = Booking.objects.filter(
        status='Delivered',
        hotel_details__check_out_date=today
    ).distinct().count()
    
    print(f"   - Check-ins: {check_ins_today}")
    print(f"   - Check-outs: {check_outs_today}")
    
    # Show sample bookings for today
    if check_ins_today > 0:
        print(f"\n   📋 Today's Check-ins:")
        today_bookings = Booking.objects.filter(
            status='Delivered',
            hotel_details__check_in_date=today
        ).distinct()[:5]
        
        for booking in today_bookings:
            print(f"   - {booking.booking_number}: {booking.total_pax} pax")
    
    print(f"\n{'='*80}")
    print("🎉 DAILY OPERATIONS READY!")
    print(f"{'='*80}")
    print(f"\n💡 Test the API with:")
    print(f"   GET /api/daily-operations/?date={today}")

if __name__ == '__main__':
    update_for_daily_operations()
