"""
Add hotel and transport details to bookings so order delivery details display.
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingHotelDetails, BookingTransportDetails
from tickets.models import Hotels
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("ADDING HOTEL AND TRANSPORT DETAILS TO BOOKINGS")
print("="*80)

# Get hotels
makkah_hotels = list(Hotels.objects.filter(organization=org, city__name='Makkah')[:3])
madinah_hotels = list(Hotels.objects.filter(organization=org, city__name='Madinah')[:2])

print(f"\nAvailable hotels:")
print(f"  Makkah: {len(makkah_hotels)}")
print(f"  Madinah: {len(madinah_hotels)}")

# Get bookings
bookings = Booking.objects.filter(organization=org).order_by('-id')[:6]
print(f"  Bookings: {bookings.count()}")

hotel_idx = 0
total_hotels_added = 0
total_transport_added = 0

for booking in bookings:
    print(f"\n{'='*80}")
    print(f"Booking #{booking.id} - {booking.booking_number}")
    
    # Check existing hotel details
    existing_hotels = BookingHotelDetails.objects.filter(booking=booking).count()
    
    if existing_hotels == 0 and len(makkah_hotels) > 0 and len(madinah_hotels) > 0:
        # Add Makkah hotel
        makkah_hotel = makkah_hotels[hotel_idx % len(makkah_hotels)]
        
        makkah_detail = BookingHotelDetails.objects.create(
            booking=booking,
            hotel=makkah_hotel,
            check_in_date=datetime.now().date() + timedelta(days=5),
            check_out_date=datetime.now().date() + timedelta(days=12),
            number_of_nights=7,
            room_type='quad',
            price=50000,
            quantity=booking.total_pax,
            total_price=50000 * booking.total_pax,
            check_in_status='active',
            check_out_status='inactive',
        )
        
        # Add Madinah hotel
        madinah_hotel = madinah_hotels[hotel_idx % len(madinah_hotels)]
        
        madinah_detail = BookingHotelDetails.objects.create(
            booking=booking,
            hotel=madinah_hotel,
            check_in_date=datetime.now().date() + timedelta(days=12),
            check_out_date=datetime.now().date() + timedelta(days=19),
            number_of_nights=7,
            room_type='quad',
            price=45000,
            quantity=booking.total_pax,
            total_price=45000 * booking.total_pax,
            check_in_status='active',
            check_out_status='inactive',
        )
        
        print(f"  ✅ Added hotel details:")
        print(f"     Makkah: {makkah_hotel.name}")
        print(f"     Madinah: {madinah_hotel.name}")
        total_hotels_added += 2
        hotel_idx += 1
    else:
        print(f"  ℹ️  Already has {existing_hotels} hotel details")
    
    # Skip transport for now - requires VehicleType instance
    # existing_transport = BookingTransportDetails.objects.filter(booking=booking).count()
    # if existing_transport == 0:
    #     transport = BookingTransportDetails.objects.create(...)
    print(f"  ℹ️  Transport skipped (requires VehicleType setup)")

print(f"\n{'='*80}")
print(f"✅ ADDED {total_hotels_added} HOTEL DETAILS!")
print(f"✅ ADDED {total_transport_added} TRANSPORT DETAILS!")
print(f"{'='*80}")

# Summary
print("\n📋 BOOKING DETAILS SUMMARY:")
for booking in bookings:
    hotels = BookingHotelDetails.objects.filter(booking=booking)
    transport = BookingTransportDetails.objects.filter(booking=booking)
    
    print(f"\nBooking #{booking.id} ({booking.booking_number}):")
    print(f"  Hotels: {hotels.count()}")
    for h in hotels:
        print(f"    - {h.hotel.name if h.hotel else 'N/A'}: {h.number_of_nights} nights, {h.room_type}")
    print(f"  Transport: {transport.count()}")
    for t in transport:
        print(f"    - {t.vehicle_type}: {t.total_price:,} PKR")
