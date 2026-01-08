"""
Final comprehensive script to populate all bookings with complete data
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import (
    Booking, BookingHotelDetails, BookingTransportDetails,
    BookingTicketDetails
)
from tickets.models import Hotels, Ticket

def populate_all_bookings():
    """Populate all bookings with complete data"""
    
    print("=" * 80)
    print("POPULATING ALL BOOKINGS WITH COMPLETE DATA")
    print("=" * 80)
    
    # Get available resources
    hotels = list(Hotels.objects.filter(is_active=True))
    tickets = list(Ticket.objects.filter(status='available'))
    
    print(f"\n📊 Available Resources:")
    print(f"   Hotels: {len(hotels)}")
    print(f"   Tickets: {len(tickets)}")
    
    bookings = Booking.objects.all().order_by('-id')
    
    for booking in bookings:
        print(f"\n{'='*80}")
        print(f"📋 {booking.booking_number} ({booking.booking_type}) - {booking.total_pax} pax")
        print(f"{'='*80}")
        
        # Determine what this booking needs
        needs_hotel = booking.booking_type in ['UMRAH', 'HOTEL', 'OTHER']
        needs_ticket = booking.booking_type in ['UMRAH', 'TICKET', 'OTHER']
        needs_transport = booking.booking_type in ['UMRAH', 'OTHER']
        
        # 1. ADD HOTELS
        if needs_hotel and not booking.hotel_details.exists() and hotels:
            print(f"\n🏨 Adding Hotels...")
            
            num_hotels = 2 if booking.booking_type == 'UMRAH' else 1
            
            for i in range(num_hotels):
                hotel = random.choice(hotels)
                
                check_in = datetime.now().date() + timedelta(days=random.randint(5, 15))
                nights = random.choice([7, 10, 14, 15])
                check_out = check_in + timedelta(days=nights)
                
                rooms_needed = max(1, booking.total_pax // 4)
                
                # Price based on hotel category
                if '5_star' in str(hotel.category):
                    price_per_night = random.randint(4000, 6000)
                elif '4_star' in str(hotel.category):
                    price_per_night = random.randint(2500, 4000)
                else:
                    price_per_night = random.randint(1500, 2500)
                
                total_price = nights * rooms_needed * price_per_night
                
                BookingHotelDetails.objects.create(
                    booking=booking,
                    hotel=hotel,
                    check_in_date=check_in,
                    check_out_date=check_out,
                    number_of_nights=nights,
                    room_type='quad',
                    price=price_per_night,
                    quantity=rooms_needed,
                    total_price=total_price,
                    is_price_pkr=True,
                    leg_no=i+1
                )
                print(f"   ✅ {hotel.name}: {nights}n × {rooms_needed}r × PKR{price_per_night:,} = PKR {total_price:,.0f}")
        
        # 2. ADD TICKETS
        if needs_ticket and not booking.ticket_details.exists() and tickets:
            print(f"\n✈️  Adding Tickets...")
            
            ticket = random.choice(tickets)
            
            adults = booking.total_adult or 0
            children = booking.total_child or 0
            infants = booking.total_infant or 0
            
            adult_price = float(ticket.adult_price or random.randint(70000, 90000))
            child_price = float(ticket.child_price or random.randint(55000, 70000))
            infant_price = float(ticket.infant_price or random.randint(8000, 15000))
            
            BookingTicketDetails.objects.create(
                booking=booking,
                ticket=ticket,
                pnr=f"PNR{random.randint(100000, 999999)}",
                adult_price=adult_price,
                child_price=child_price,
                infant_price=infant_price,
                seats=booking.total_pax,
                weight=30,
                pieces=2,
                is_umrah_seat=True,
                trip_type='round_trip',
                departure_stay_type='direct',
                return_stay_type='direct',
                status='Confirmed',
                is_meal_included=True,
                is_refundable=False
            )
            
            ticket_total = (adults * adult_price) + (children * child_price) + (infants * infant_price)
            print(f"   ✅ {adults}A×{adult_price:,.0f} + {children}C×{child_price:,.0f} + {infants}I×{infant_price:,.0f} = PKR {ticket_total:,.0f}")
        
        # 3. ADD TRANSPORT
        if needs_transport and not booking.transport_details.exists():
            print(f"\n🚌 Adding Transport...")
            
            price_per_person = random.randint(1500, 3000)
            total_transport = price_per_person * booking.total_pax
            
            BookingTransportDetails.objects.create(
                booking=booking,
                is_price_pkr=True,
                price_in_pkr=total_transport,
                riyal_rate=75
            )
            print(f"   ✅ {booking.total_pax} pax × PKR {price_per_person:,.0f} = PKR {total_transport:,.0f}")
        
        # 4. SET FLAGS
        if booking.booking_type in ['UMRAH', 'OTHER']:
            booking.is_food_included = True
            print(f"\n🍽️  Food: Included")
        
        if booking.booking_type == 'UMRAH':
            booking.is_ziyarat_included = True
            print(f"🕌 Ziyarat: Included")
        
        booking.save()
        print(f"\n✅ {booking.booking_number} populated!")
    
    print(f"\n{'='*80}")
    print("🔄 Recalculating all amounts...")
    print(f"{'='*80}\n")
    
    recalculate_amounts()

def recalculate_amounts():
    """Recalculate all booking amounts"""
    
    bookings = Booking.objects.all()
    
    for booking in bookings:
        print(f"💰 {booking.booking_number}...")
        
        hotel_amt = 0
        ticket_amt = 0
        transport_amt = 0
        visa_amt = 0
        food_amt = 0
        ziyarat_amt = 0
        
        # Hotels
        for hotel in booking.hotel_details.all():
            if hotel.total_price:
                hotel_amt += float(hotel.total_price)
        
        # Tickets
        for ticket in booking.ticket_details.all():
            adults = booking.total_adult or 0
            children = booking.total_child or 0
            infants = booking.total_infant or 0
            
            ticket_amt += (adults * float(ticket.adult_price or 0)) + \
                         (children * float(ticket.child_price or 0)) + \
                         (infants * float(ticket.infant_price or 0))
        
        # Transport
        for transport in booking.transport_details.all():
            if transport.price_in_pkr:
                transport_amt += float(transport.price_in_pkr)
        
        # Visa
        for person in booking.person_details.all():
            if person.visa_price:
                visa_amt += float(person.visa_price)
        
        # Food
        if booking.is_food_included:
            food_per_day = random.randint(500, 700)
            food_amt = booking.total_pax * food_per_day * 14
        
        # Ziyarat
        if booking.is_ziyarat_included:
            ziyarat_per_person = random.randint(2500, 3500)
            ziyarat_amt = booking.total_pax * ziyarat_per_person
        
        # Calculate total
        grand_total = hotel_amt + ticket_amt + transport_amt + visa_amt + food_amt + ziyarat_amt
        
        # DIRECT UPDATE
        Booking.objects.filter(id=booking.id).update(
            total_hotel_amount_pkr=hotel_amt,
            total_ticket_amount_pkr=ticket_amt,
            total_transport_amount_pkr=transport_amt,
            total_visa_amount_pkr=visa_amt,
            total_food_amount_pkr=food_amt,
            total_ziyarat_amount_pkr=ziyarat_amt,
            total_amount=grand_total,
            total_in_pkr=grand_total
        )
        
        print(f"   H:{hotel_amt:,.0f} T:{ticket_amt:,.0f} Tr:{transport_amt:,.0f} V:{visa_amt:,.0f} F:{food_amt:,.0f} Z:{ziyarat_amt:,.0f} = PKR {grand_total:,.0f}")
    
    print(f"\n{'='*80}")
    print("✅ ALL AMOUNTS CALCULATED!")
    print(f"{'='*80}")
    
    # Summary
    from django.db.models import Sum
    
    total_revenue = Booking.objects.aggregate(total=Sum('total_in_pkr'))['total'] or 0
    
    print(f"\n📊 FINAL SUMMARY:")
    print(f"   Total Bookings: {Booking.objects.count()}")
    print(f"   Total Revenue: PKR {total_revenue:,.0f}")
    
    hotel_total = Booking.objects.aggregate(total=Sum('total_hotel_amount_pkr'))['total'] or 0
    ticket_total = Booking.objects.aggregate(total=Sum('total_ticket_amount_pkr'))['total'] or 0
    transport_total = Booking.objects.aggregate(total=Sum('total_transport_amount_pkr'))['total'] or 0
    visa_total = Booking.objects.aggregate(total=Sum('total_visa_amount_pkr'))['total'] or 0
    food_total = Booking.objects.aggregate(total=Sum('total_food_amount_pkr'))['total'] or 0
    ziyarat_total = Booking.objects.aggregate(total=Sum('total_ziyarat_amount_pkr'))['total'] or 0
    
    print(f"\n   Component Breakdown:")
    print(f"   🏨 Hotels:    PKR {hotel_total:>15,.0f}")
    print(f"   ✈️  Tickets:   PKR {ticket_total:>15,.0f}")
    print(f"   🚌 Transport: PKR {transport_total:>15,.0f}")
    print(f"   🎫 Visa:      PKR {visa_total:>15,.0f}")
    print(f"   🍽️  Food:      PKR {food_total:>15,.0f}")
    print(f"   🕌 Ziyarat:   PKR {ziyarat_total:>15,.0f}")
    print(f"   {'─'*50}")
    print(f"   💰 TOTAL:     PKR {total_revenue:>15,.0f}")

if __name__ == '__main__':
    populate_all_bookings()
