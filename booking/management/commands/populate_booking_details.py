"""
Management command to populate booking details.
Usage: python manage.py populate_booking_details --booking_id=309
"""
from django.core.management.base import BaseCommand
from booking.models import (
    Booking, BookingHotelDetails, BookingTransportDetails, 
    BookingFoodDetails, BookingZiyaratDetails, BookingTransportSector
)
from tickets.models import Hotels
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Populate booking with sample hotel, transport, food, and ziyarat details'

    def add_arguments(self, parser):
        parser.add_argument('--booking_id', type=int, default=309, help='Booking ID to populate')

    def handle(self, *args, **options):
        booking_id = options['booking_id']
        
        try:
            booking = Booking.objects.get(id=booking_id)
            self.stdout.write(f"Found booking: {booking.booking_number}")
        except Booking.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Booking {booking_id} not found!"))
            return

        # ========== GET OR CREATE HOTEL ==========
        hotel_obj = Hotels.objects.first()
        if not hotel_obj:
            self.stdout.write("\n📌 Creating a sample hotel...")
            hotel_obj = Hotels.objects.create(
                name="Hilton Makkah Convention Hotel",
                address="King Abdul Aziz Road, Makkah, Saudi Arabia",
                category="5_star",
                status="active",
                is_active=True,
                distance=0.5,
                walking_distance=500,
                walking_time=6,
                organization=booking.organization
            )
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created hotel: {hotel_obj.name}"))
        else:
            self.stdout.write(f"Using existing hotel: {hotel_obj.name}")

        # ========== ADD HOTEL DETAILS ==========
        if not booking.hotel_details.exists():
            self.stdout.write("\n📌 Adding Hotel Details...")
            
            hotel_detail = BookingHotelDetails.objects.create(
                booking=booking,
                hotel=hotel_obj,
                self_hotel_name=hotel_obj.name,
                check_in_date=date.today() + timedelta(days=5),
                check_out_date=date.today() + timedelta(days=10),
                room_type="Double",
                quantity=1,
                price=15000,
                number_of_nights=5,
                total_price=75000,
                is_price_pkr=True,
                riyal_rate=75,
                total_in_pkr=75000,
                total_in_riyal_rate=1000,
                contact_person_name="Hotel Reception",
                contact_person_number="+966 12 123 4567",
                hotel_voucher_number="VCH-HTL-001",
                hotel_brn="BRN-HTL-001"
            )
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created hotel detail: {hotel_detail.self_hotel_name}"))
        else:
            self.stdout.write("Hotel details already exist")

        # ========== ADD TRANSPORT DETAILS ==========
        if not booking.transport_details.exists():
            self.stdout.write("\n📌 Adding Transport Details...")
            
            transport = BookingTransportDetails.objects.create(
                booking=booking,
                price_in_pkr=25000,
                price_in_sar=330,
                is_price_pkr=True,
                riyal_rate=75,
                voucher_no="VCH-TRANS-001",
                brn_no="BRN-TRANS-001"
            )
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created transport detail"))
            
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
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created sector: {sector.departure_city} → {sector.arrival_city}"))
        else:
            self.stdout.write("Transport details already exist")

        # ========== ADD FOOD DETAILS ==========
        if not booking.food_details.exists():
            self.stdout.write("\n📌 Adding Food Details...")
            
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
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created food plan: {food.food}"))
        else:
            self.stdout.write("Food details already exist")

        # ========== ADD ZIYARAT DETAILS ==========
        if not booking.ziyarat_details.exists():
            self.stdout.write("\n📌 Adding Ziyarat Details...")
            
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
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created ziyarat: {ziyarat.ziarat}"))
        else:
            self.stdout.write("Ziyarat details already exist")

        # ========== UPDATE BOOKING TOTALS ==========
        self.stdout.write("\n📌 Updating booking totals...")

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

        self.stdout.write(f"  ✓ Hotel Total: PKR {total_hotel:,.0f}")
        self.stdout.write(f"  ✓ Transport Total: PKR {total_transport:,.0f}")
        self.stdout.write(f"  ✓ Food Total: PKR {total_food:,.0f}")
        self.stdout.write(f"  ✓ Ziyarat Total: PKR {total_ziyarat:,.0f}")
        self.stdout.write(f"  ✓ Ticket Total: PKR {total_ticket:,.0f}")
        self.stdout.write(f"  ✓ Grand Total: PKR {booking.total_amount:,.0f}")

        self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully populated booking {booking.booking_number} with all details!"))
