#!/usr/bin/env python3
"""
Quick script to check available IDs in database
Run this to see what bookings, pax, and hotels exist
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail
from tickets.models import Hotels
from operations.models import RoomMap

def check_database():
    print("=" * 60)
    print("DATABASE ID CHECKER")
    print("=" * 60)
    
    # Check Bookings
    print("\n📋 BOOKINGS:")
    bookings = Booking.objects.all()[:5]
    if bookings:
        for booking in bookings:
            print(f"   ✅ ID: {booking.id} | Number: {booking.booking_number} | Pax: {booking.total_pax}")
    else:
        print("   ❌ No bookings found!")
    
    # Check Pax (BookingPersonDetail)
    print("\n👤 PAX (Passengers):")
    pax_list = BookingPersonDetail.objects.all()[:5]
    if pax_list:
        for pax in pax_list:
            print(f"   ✅ ID: {pax.id} | Name: {pax.first_name} {pax.last_name} | Booking: {pax.booking_id}")
    else:
        print("   ❌ No pax found!")
    
    # Check Hotels
    print("\n🏨 HOTELS:")
    hotels = Hotels.objects.all()[:5]
    if hotels:
        for hotel in hotels:
            print(f"   ✅ ID: {hotel.id} | Name: {hotel.name} | City: {hotel.city}")
    else:
        print("   ❌ No hotels found!")
    
    # Check Rooms
    print("\n🚪 ROOMS:")
    rooms = RoomMap.objects.all()[:5]
    if rooms:
        for room in rooms:
            print(f"   ✅ ID: {room.id} | Hotel: {room.hotel.name} | Room: {room.room_no} | Floor: {room.floor_no}")
    else:
        print("   ❌ No rooms found!")
    
    print("\n" + "=" * 60)
    print("SAMPLE DATA FOR POST REQUEST:")
    print("=" * 60)
    
    if bookings and pax_list and hotels:
        booking = bookings[0]
        pax = pax_list[0]
        hotel = hotels[0]
        
        sample_data = {
            "booking": booking.id,
            "pax": pax.id,
            "pax_id_str": f"PAX{pax.id:03d}",
            "pax_first_name": pax.first_name or "Ali",
            "pax_last_name": pax.last_name or "Raza",
            "booking_id_str": booking.booking_number,
            "contact_no": pax.contact_number or "+92300-0709017",
            "family_head_contact": pax.contact_number or "+92300-0709017",
            "hotel": hotel.id,
            "hotel_name": hotel.name,
            "city": str(hotel.city) if hotel.city else "Makkah",
            "date": "2025-10-28",
            "check_in_date": "2025-10-28",
            "check_out_date": "2025-10-31",
            "status": "pending"
        }
        
        if rooms:
            room = rooms[0]
            sample_data["room"] = room.id
            sample_data["room_no"] = room.room_no
            sample_data["bed_no"] = "B1"
        
        print("\n✅ Use this JSON in Swagger UI:")
        print("\n```json")
        import json
        print(json.dumps(sample_data, indent=2))
        print("```")
    else:
        print("\n⚠️ Missing data in database!")
        print("   Please create:")
        if not bookings:
            print("   - At least one Booking")
        if not pax_list:
            print("   - At least one BookingPersonDetail")
        if not hotels:
            print("   - At least one Hotel")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    check_database()
