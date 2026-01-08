"""
Check which hotels passengers are currently in based on today's date
"""

import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

def check_current_hotel_status():
    """Check passenger distribution by current hotel"""
    
    print("=" * 80)
    print("CURRENT HOTEL STATUS CHECK")
    print("=" * 80)
    
    today = datetime.now().date()
    print(f"\n📅 Today: {today}\n")
    
    delivered_bookings = Booking.objects.filter(status='Delivered').order_by('booking_number')
    
    status_counts = {
        'in_pakistan': 0,
        'in_flight': 0,
        'in_makkah': 0,
        'in_madinah': 0,
        'exit_pending': 0,
        'exited': 0,
        'unknown': 0
    }
    
    for booking in delivered_bookings:
        pax_count = booking.person_details.filter(visa_status='Approved').count()
        
        if pax_count == 0:
            continue
            
        hotels = booking.hotel_details.all().order_by('check_in_date')
        
        if not hotels:
            print(f"❌ {booking.booking_number}: No hotels ({pax_count} pax)")
            status_counts['in_pakistan'] += pax_count
            continue
        
        # Check first hotel
        first_hotel = hotels.first()
        last_hotel = hotels.last()
        
        first_checkin = datetime.strptime(str(first_hotel.check_in_date), '%Y-%m-%d').date() if first_hotel.check_in_date else None
        last_checkout = datetime.strptime(str(last_hotel.check_out_date), '%Y-%m-%d').date() if last_hotel.check_out_date else None
        
        # Determine status
        if not first_checkin:
            status = 'in_pakistan'
            status_counts['in_pakistan'] += pax_count
        elif today < first_checkin:
            status = 'in_pakistan'
            status_counts['in_pakistan'] += pax_count
        elif today == first_checkin:
            status = 'in_flight'
            status_counts['in_flight'] += pax_count
        elif last_checkout and today > last_checkout:
            status = 'exited'
            status_counts['exited'] += pax_count
        else:
            # Find current hotel
            current_hotel = None
            for hotel in hotels:
                checkin = datetime.strptime(str(hotel.check_in_date), '%Y-%m-%d').date() if hotel.check_in_date else None
                checkout = datetime.strptime(str(hotel.check_out_date), '%Y-%m-%d').date() if hotel.check_out_date else None
                
                if checkin and checkout and checkin <= today <= checkout:
                    current_hotel = hotel
                    break
            
            if current_hotel:
                hotel_name = current_hotel.hotel.name if current_hotel.hotel else "Unknown"
                city_obj = current_hotel.hotel.city if current_hotel.hotel else None
                city = city_obj.name if city_obj and hasattr(city_obj, 'name') else str(city_obj) if city_obj else "Unknown"
                
                if 'Makkah' in city or 'Mecca' in city:
                    status = 'in_makkah'
                    status_counts['in_makkah'] += pax_count
                elif 'Madinah' in city or 'Madina' in city or 'Medina' in city:
                    status = 'in_madinah'
                    status_counts['in_madinah'] += pax_count
                else:
                    status = f'in_{city.lower()}'
                    status_counts['unknown'] += pax_count
                
                print(f"🏨 {booking.booking_number}: {hotel_name} ({city}) - {status} ({pax_count} pax)")
            else:
                status = 'unknown'
                status_counts['unknown'] += pax_count
                print(f"❓ {booking.booking_number}: No current hotel ({pax_count} pax)")
    
    print(f"\n{'='*80}")
    print("📊 EXPECTED DISTRIBUTION:")
    print(f"{'='*80}")
    print(f"   🇵🇰 In Pakistan:  {status_counts['in_pakistan']} passengers")
    print(f"   ✈️  In Flight:     {status_counts['in_flight']} passengers")
    print(f"   🕋 In Makkah:     {status_counts['in_makkah']} passengers")
    print(f"   🕌 In Madinah:    {status_counts['in_madinah']} passengers")
    print(f"   ⏳ Exit Pending:  {status_counts['exit_pending']} passengers")
    print(f"   ✅ Exited KSA:    {status_counts['exited']} passengers")
    print(f"   ❓ Unknown:       {status_counts['unknown']} passengers")
    print(f"   {'─'*40}")
    total = sum(status_counts.values())
    print(f"   💰 TOTAL:         {total} passengers")

if __name__ == '__main__':
    check_current_hotel_status()
