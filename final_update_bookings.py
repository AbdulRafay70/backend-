"""
Final comprehensive update of all booking amounts with proper pricing
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import (
    Booking, BookingHotelDetails, BookingTransportDetails,
    BookingTicketDetails, BookingPersonDetail
)
from packages.models import UmrahPackage
from django.db.models import Sum

def update_all_booking_amounts():
    """Comprehensive update of all booking amounts"""
    
    print("=" * 70)
    print("COMPREHENSIVE BOOKING AMOUNTS UPDATE")
    print("=" * 70)
    
    bookings = Booking.objects.all().order_by('-id')
    updated_count = 0
    
    for booking in bookings:
        print(f"\n📋 {booking.booking_number} ({booking.booking_type}) - {booking.total_pax} pax")
        
        # Initialize amounts
        hotel_amt = 0
        ticket_amt = 0
        transport_amt = 0
        visa_amt = 0
        food_amt = 0
        ziyarat_amt = 0
        
        # 1. HOTEL AMOUNTS
        for hotel_detail in booking.hotel_details.all():
            if hotel_detail.total_price:
                hotel_amt += hotel_detail.total_price
            else:
                # Calculate: nights × rooms × price_per_night
                nights = hotel_detail.number_of_nights or 7
                rooms = hotel_detail.quantity or max(1, booking.total_pax // 4)
                price = hotel_detail.price or 3500
                calc_total = nights * rooms * price
                hotel_detail.total_price = calc_total
                hotel_detail.save()
                hotel_amt += calc_total
        
        if hotel_amt > 0:
            print(f"   🏨 Hotels: PKR {hotel_amt:,.0f}")
        
        # 2. TICKET AMOUNTS
        for ticket_detail in booking.ticket_details.all():
            adults = booking.total_adult or 0
            children = booking.total_child or 0
            infants = booking.total_infant or 0
            
            adult_price = ticket_detail.adult_price or 75000
            child_price = ticket_detail.child_price or 60000
            infant_price = ticket_detail.infant_price or 10000
            
            ticket_amt += (adults * adult_price) + (children * child_price) + (infants * infant_price)
        
        if ticket_amt > 0:
            print(f"   ✈️  Tickets: PKR {ticket_amt:,.0f}")
        
        # 3. TRANSPORT AMOUNTS
        for transport_detail in booking.transport_details.all():
            price = transport_detail.price or 2000
            pax = booking.total_pax or 1
            trans_total = price * pax
            
            if not transport_detail.total_amount or transport_detail.total_amount == 0:
                transport_detail.total_amount = trans_total
                transport_detail.save()
            
            transport_amt += transport_detail.total_amount or trans_total
        
        if transport_amt > 0:
            print(f"   🚌 Transport: PKR {transport_amt:,.0f}")
        
        # 4. VISA AMOUNTS (from person details)
        for person in booking.person_details.all():
            if person.age_group == 'adult':
                visa_price = 12000
            elif person.age_group == 'child':
                visa_price = 9000
            else:  # infant
                visa_price = 5000
            
            if not person.visa_price or person.visa_price == 0:
                person.visa_price = visa_price
                person.is_visa_included = True
                person.save()
            
            visa_amt += person.visa_price
        
        if visa_amt > 0:
            print(f"   🎫 Visa: PKR {visa_amt:,.0f}")
        
        # 5. FOOD AMOUNTS (if included)
        if booking.is_food_included:
            days = 14
            food_per_day = 500
            food_amt = booking.total_pax * days * food_per_day
            print(f"   🍽️  Food: PKR {food_amt:,.0f}")
        
        # 6. ZIYARAT AMOUNTS (if included)
        if booking.is_ziyarat_included:
            ziyarat_per_person = 3000
            ziyarat_amt = booking.total_pax * ziyarat_per_person
            print(f"   🕌 Ziyarat: PKR {ziyarat_amt:,.0f}")
        
        # 7. UPDATE BOOKING TOTALS
        booking.total_hotel_amount_pkr = hotel_amt
        booking.total_ticket_amount_pkr = ticket_amt
        booking.total_transport_amount_pkr = transport_amt
        booking.total_visa_amount_pkr = visa_amt
        booking.total_food_amount_pkr = food_amt
        booking.total_ziyarat_amount_pkr = ziyarat_amt
        
        grand_total = hotel_amt + ticket_amt + transport_amt + visa_amt + food_amt + ziyarat_amt
        booking.total_amount = grand_total
        booking.total_in_pkr = grand_total
        booking.save()
        
        print(f"   💰 TOTAL: PKR {grand_total:,.0f}")
        updated_count += 1
    
    print("\n" + "=" * 70)
    print(f"✅ UPDATED {updated_count} BOOKINGS SUCCESSFULLY!")
    print("=" * 70)
    
    # SUMMARY
    print(f"\n📊 FINAL SUMMARY:")
    print(f"   Total Bookings: {Booking.objects.count()}")
    
    total_revenue = Booking.objects.aggregate(total=Sum('total_in_pkr'))['total'] or 0
    print(f"   Total Revenue:  PKR {total_revenue:,.0f}")
    
    print(f"\n   Revenue Breakdown:")
    print(f"   {'Type':<20} {'Count':>6} {'Revenue':>15}")
    print(f"   {'-'*20} {'-'*6} {'-'*15}")
    
    for booking_type in ['UMRAH', 'HOTEL', 'TICKET', 'OTHER']:
        count = Booking.objects.filter(booking_type=booking_type).count()
        revenue = Booking.objects.filter(booking_type=booking_type).aggregate(total=Sum('total_in_pkr'))['total'] or 0
        if count > 0:
            print(f"   {booking_type:<20} {count:>6} PKR {revenue:>12,.0f}")
    
    print(f"\n   Component Breakdown:")
    hotel_total = Booking.objects.aggregate(total=Sum('total_hotel_amount_pkr'))['total'] or 0
    ticket_total = Booking.objects.aggregate(total=Sum('total_ticket_amount_pkr'))['total'] or 0
    transport_total = Booking.objects.aggregate(total=Sum('total_transport_amount_pkr'))['total'] or 0
    visa_total = Booking.objects.aggregate(total=Sum('total_visa_amount_pkr'))['total'] or 0
    food_total = Booking.objects.aggregate(total=Sum('total_food_amount_pkr'))['total'] or 0
    ziyarat_total = Booking.objects.aggregate(total=Sum('total_ziyarat_amount_pkr'))['total'] or 0
    
    print(f"   🏨 Hotels:    PKR {hotel_total:>12,.0f}")
    print(f"   ✈️  Tickets:   PKR {ticket_total:>12,.0f}")
    print(f"   🚌 Transport: PKR {transport_total:>12,.0f}")
    print(f"   🎫 Visa:      PKR {visa_total:>12,.0f}")
    print(f"   🍽️  Food:      PKR {food_total:>12,.0f}")
    print(f"   🕌 Ziyarat:   PKR {ziyarat_total:>12,.0f}")
    print(f"   {'-'*40}")
    print(f"   💰 TOTAL:     PKR {total_revenue:>12,.0f}")

if __name__ == '__main__':
    update_all_booking_amounts()
