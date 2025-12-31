"""
Run this script to populate booking data for booking ID 309:
From backend directory: python -c "import django; django.setup(); exec(open('populate_booking_data.py').read())"
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sae_pk.settings')

from booking.models import (
    Booking, BookingHotelDetails, BookingTransportDetails, 
    BookingFoodDetails, BookingZiyaratDetails, BookingTransportSector
)
from datetime import date, timedelta
import random

# Target booking
BOOKING_ID = 309

try:
    booking = Booking.objects.get(id=BOOKING_ID)
    print(f"Found booking: {booking.booking_number}")
except Booking.DoesNotExist:
    print(f"Booking {BOOKING_ID} not found!")
    exit()

# ========== ADD HOTEL DETAILS ==========
if not booking.hotel_details.exists():
    print("\n📌 Adding Hotel Details...")
    
    hotel = BookingHotelDetails.objects.create(
        booking=booking,
        self_hotel_name="Hilton Makkah Convention Hotel",
        city_name="Makkah",
        check_in_date=date.today() + timedelta(days=5),
        check_out_date=date.today() + timedelta(days=10),
        room_type="Double",
        number_of_rooms=1,
        room_price=15000,
        number_of_nights=5,
        total_price=75000,
        is_price_pkr=True,
        riyal_rate=75,
        contact_person_name="Hotel Reception",
        contact_number="+966 12 123 4567",
        voucher_number="VCH-HTL-001",
        brn="BRN-HTL-001"
    )
    print(f"  ✓ Created hotel: {hotel.self_hotel_name}")
else:
    print("Hotel details already exist")

# ========== ADD TRANSPORT DETAILS ==========
if not booking.transport_details.exists():
    print("\n📌 Adding Transport Details...")
    
    transport = BookingTransportDetails.objects.create(
        booking=booking,
        vehicle_name="Toyota Hiace",
        vehicle_description="14 Seater Van",
        driver_name="Mohammed Ali",
        driver_contact="+966 55 123 4567",
        pickup_location="Jeddah Airport",
        drop_location="Makkah Hotel",
        price_in_pkr=25000,
        price_in_sar=330,
        is_price_pkr=True,
        riyal_rate=75,
        contact_person_name="Transport Coordinator",
        contact_number="+966 55 987 6543"
    )
    print(f"  ✓ Created transport: {transport.vehicle_name}")
    
    # Add sector details
    sector = BookingTransportSector.objects.create(
        transport_detail=transport,
        sector_no=1,
        sector_type="AIRPORT PICKUP",
        is_airport_pickup=True,
        departure_city="Jeddah",
        arrival_city="Makkah",
        date=date.today() + timedelta(days=5),
        contact_number="+966 55 123 4567",
        contact_person_name="Driver Mohammed"
    )
    print(f"  ✓ Created sector: {sector.departure_city} → {sector.arrival_city}")
else:
    print("Transport details already exist")

# ========== ADD FOOD DETAILS ==========
if not booking.food_details.exists():
    print("\n📌 Adding Food Details...")
    
    food = BookingFoodDetails.objects.create(
        booking=booking,
        food="Full Board Meals (Breakfast, Lunch, Dinner)",
        adult_price=5000,
        child_price=2500,
        infant_price=0,
        total_adults=1,
        total_children=0,
        total_infants=0,
        is_price_pkr=True,
        riyal_rate=75,
        total_price_pkr=5000,
        total_price_sar=67,
        contact_person_name="Food Service Manager",
        contact_number="+966 12 555 4444",
        food_voucher_number="VCH-FOOD-001",
        food_brn="BRN-FOOD-001",
        status="Pending"
    )
    print(f"  ✓ Created food plan: {food.food}")
else:
    print("Food details already exist")

# ========== ADD ZIYARAT DETAILS ==========
if not booking.ziyarat_details.exists():
    print("\n📌 Adding Ziyarat Details...")
    
    ziyarat = BookingZiyaratDetails.objects.create(
        booking=booking,
        ziarat="Jabal Al-Noor & Ghar Hira",
        city="Makkah",
        adult_price=3000,
        child_price=1500,
        infant_price=0,
        total_adults=1,
        total_children=0,
        total_infants=0,
        is_price_pkr=True,
        riyal_rate=75,
        total_price_pkr=3000,
        total_price_sar=40,
        date=date.today() + timedelta(days=7),
        contact_person_name="Ziyarat Guide",
        contact_number="+966 55 111 2222",
        ziyarat_voucher_number="VCH-ZIY-001",
        ziyarat_brn="BRN-ZIY-001",
        status="Pending"
    )
    print(f"  ✓ Created ziyarat: {ziyarat.ziarat}")
else:
    print("Ziyarat details already exist")

# ========== UPDATE BOOKING TOTALS ==========
print("\n📌 Updating booking totals...")

# Calculate totals
total_hotel = sum(h.total_price or 0 for h in booking.hotel_details.all())
total_transport = sum(t.price_in_pkr or 0 for t in booking.transport_details.all())
total_food = sum(f.total_price_pkr or 0 for f in booking.food_details.all())
total_ziyarat = sum(z.total_price_pkr or 0 for z in booking.ziyarat_details.all())
total_ticket = booking.total_ticket_amount_pkr or 0

# Update booking
booking.total_hotel_amount_pkr = total_hotel
booking.total_transport_amount_pkr = total_transport
booking.total_food_amount_pkr = total_food
booking.total_ziyarat_amount_pkr = total_ziyarat
booking.total_amount = total_hotel + total_transport + total_food + total_ziyarat + total_ticket
booking.total_in_pkr = booking.total_amount
booking.is_food_included = True
booking.is_ziyarat_included = True
booking.save()

print(f"  ✓ Hotel Total: PKR {total_hotel:,.0f}")
print(f"  ✓ Transport Total: PKR {total_transport:,.0f}")
print(f"  ✓ Food Total: PKR {total_food:,.0f}")
print(f"  ✓ Ziyarat Total: PKR {total_ziyarat:,.0f}")
print(f"  ✓ Ticket Total: PKR {total_ticket:,.0f}")
print(f"  ✓ Grand Total: PKR {booking.total_amount:,.0f}")

print(f"\n✅ Successfully populated booking {booking.booking_number} with all details!")
