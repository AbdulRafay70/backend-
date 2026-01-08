"""
Enhanced script to populate package bookings with complete hotel and ticket details
from their associated UmrahPackage
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import (
    Booking, BookingHotelDetails, BookingTransportDetails,
    BookingTicketDetails, BookingPersonDetail
)
from packages.models import UmrahPackage
from tickets.models import Hotels, Ticket
from django.db.models import Sum

def populate_package_booking_details():
    """Populate package bookings with hotel and ticket details from their packages"""
    
    print("=" * 60)
    print("Populating Package Booking Details")
    print("=" * 60)
    
    # Get all package bookings
    package_bookings = Booking.objects.filter(booking_type='UMRAH').exclude(umrah_package__isnull=True)
    
    print(f"\nFound {package_bookings.count()} package bookings to process\n")
    
    for booking in package_bookings:
        package = booking.umrah_package
        if not package:
            continue
            
        print(f"\n📦 Processing: {booking.booking_number}")
        print(f"   Package: {package.title}")
        print(f"   Passengers: {booking.total_pax}")
        
        # 1. Add Hotel Details from Package
        if package.hotel_details.exists():
            print(f"   🏨 Adding hotel details...")
            
            # Clear existing hotel details for this booking
            booking.hotel_details.all().delete()
            
            for pkg_hotel in package.hotel_details.all():
                hotel_info = pkg_hotel.hotel_info
                
                # Create hotel booking detail
                hotel_detail = BookingHotelDetails.objects.create(
                    booking=booking,
                    hotel=hotel_info,
                    check_in_date=pkg_hotel.check_in_date,
                    check_out_date=pkg_hotel.check_out_date,
                    number_of_nights=pkg_hotel.number_of_nights,
                    room_type='quad',  # Default room type
                    price=3500,  # Price per night
                    quantity=max(1, booking.total_pax // 4),  # Number of rooms needed
                    total_price=pkg_hotel.number_of_nights * 3500 * max(1, booking.total_pax // 4),
                    is_price_pkr=True
                )
                print(f"      - Added: {hotel_info.name} ({pkg_hotel.number_of_nights} nights)")
        
        # 2. Add Ticket Details from Package
        if package.ticket_details.exists():
            print(f"   ✈️  Adding ticket details...")
            
            # Clear existing ticket details for this booking
            booking.ticket_details.all().delete()
            
            for pkg_ticket in package.ticket_details.all():
                ticket_info = pkg_ticket.ticket_info
                
                # Create ticket booking detail
                ticket_detail = BookingTicketDetails.objects.create(
                    booking=booking,
                    ticket=ticket_info,
                    pnr=f"PNR{booking.id}{ticket_info.id}",
                    adult_price=ticket_info.adult_price or 75000,
                    child_price=ticket_info.child_price or 60000,
                    infant_price=ticket_info.infant_price or 10000,
                    seats=booking.total_pax,
                    weight=ticket_info.weight or 30,
                    pieces=ticket_info.pieces or 2,
                    is_umrah_seat=True,
                    trip_type=ticket_info.trip_type or 'round_trip',
                    departure_stay_type=ticket_info.departure_stay_type or 'direct',
                    return_stay_type=ticket_info.return_stay_type or 'direct',
                    status='Confirmed',
                    is_meal_included=ticket_info.is_meal_included,
                    is_refundable=ticket_info.is_refundable
                )
                print(f"      - Added: Ticket {ticket_info.ticket_number or 'N/A'}")
        
        # 3. Add Transport Details from Package
        if package.transport_details.exists():
            print(f"   🚌 Adding transport details...")
            
            # Clear existing transport details for this booking
            booking.transport_details.all().delete()
            
            for pkg_transport in package.transport_details.all():
                transport_detail = BookingTransportDetails.objects.create(
                    booking=booking,
                    transport_sector=pkg_transport.transport_sector,
                    vehicle_type=pkg_transport.vehicle_type or 'coaster',
                    transport_type=pkg_transport.transport_type or 'private',
                    price=pkg_transport.transport_selling_price or 2000,
                    total_amount=(pkg_transport.transport_selling_price or 2000) * booking.total_pax,
                    quantity=booking.total_pax
                )
                print(f"      - Added: Transport ({pkg_transport.vehicle_type})")
        
        # 4. Update Food and Ziyarat flags
        if package.food_selling_price and package.food_selling_price > 0:
            booking.is_food_included = True
            booking.total_food_amount_pkr = package.food_selling_price * booking.total_pax * 14  # 14 days
            print(f"   🍽️  Food included: PKR {booking.total_food_amount_pkr:,.0f}")
        
        if (package.makkah_ziyarat_selling_price and package.makkah_ziyarat_selling_price > 0) or \
           (package.madinah_ziyarat_selling_price and package.madinah_ziyarat_selling_price > 0):
            booking.is_ziyarat_included = True
            makkah_ziyarat = package.makkah_ziyarat_selling_price or 0
            madinah_ziyarat = package.madinah_ziyarat_selling_price or 0
            booking.total_ziyarat_amount_pkr = (makkah_ziyarat + madinah_ziyarat) * booking.total_pax
            print(f"   🕌 Ziyarat included: PKR {booking.total_ziyarat_amount_pkr:,.0f}")
        
        booking.save()
        print(f"   ✅ Package booking details added!")
    
    print("\n" + "=" * 60)
    print("✅ PACKAGE BOOKINGS POPULATED!")
    print("=" * 60)
    
    # Now re-run the amount calculation
    print("\n🔄 Recalculating all booking amounts...\n")
    from update_booking_amounts import update_booking_amounts
    update_booking_amounts()

if __name__ == '__main__':
    populate_package_booking_details()
