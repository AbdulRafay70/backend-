"""
FINAL FIX: Properly update ALL amount fields in bookings
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from django.db.models import Sum

def fix_all_booking_amounts():
    """Fix all booking amount fields properly"""
    
    print("=" * 70)
    print("FIXING ALL BOOKING AMOUNT FIELDS")
    print("=" * 70)
    
    bookings = Booking.objects.all().order_by('-id')
    
    for booking in bookings:
        print(f"\n📋 {booking.booking_number} ({booking.booking_type})")
        
        # Initialize
        hotel_amt = Decimal('0')
        ticket_amt = Decimal('0')
        transport_amt = Decimal('0')
        visa_amt = Decimal('0')
        food_amt = Decimal('0')
        ziyarat_amt = Decimal('0')
        
        # 1. HOTELS
        for hotel in booking.hotel_details.all():
            if hotel.total_price:
                hotel_amt += Decimal(str(hotel.total_price))
        
        # 2. TICKETS
        for ticket in booking.ticket_details.all():
            adults = booking.total_adult or 0
            children = booking.total_child or 0
            infants = booking.total_infant or 0
            
            adult_price = Decimal(str(ticket.adult_price or 75000))
            child_price = Decimal(str(ticket.child_price or 60000))
            infant_price = Decimal(str(ticket.infant_price or 10000))
            
            ticket_amt += (adults * adult_price) + (children * child_price) + (infants * infant_price)
        
        # 3. TRANSPORT
        for transport in booking.transport_details.all():
            if transport.total_amount:
                transport_amt += Decimal(str(transport.total_amount))
        
        # 4. VISA (from person details)
        for person in booking.person_details.all():
            if person.visa_price:
                visa_amt += Decimal(str(person.visa_price))
        
        # 5. FOOD
        if booking.is_food_included:
            food_amt = Decimal(str(booking.total_pax * 14 * 500))  # 14 days, 500 per day
        
        # 6. ZIYARAT
        if booking.is_ziyarat_included:
            ziyarat_amt = Decimal(str(booking.total_pax * 3000))  # 3000 per person
        
        # UPDATE ALL FIELDS
        booking.total_hotel_amount_pkr = float(hotel_amt)
        booking.total_ticket_amount_pkr = float(ticket_amt)
        booking.total_transport_amount_pkr = float(transport_amt)
        booking.total_visa_amount_pkr = float(visa_amt)
        booking.total_food_amount_pkr = float(food_amt)
        booking.total_ziyarat_amount_pkr = float(ziyarat_amt)
        
        # Calculate grand total
        grand_total = hotel_amt + ticket_amt + transport_amt + visa_amt + food_amt + ziyarat_amt
        booking.total_amount = float(grand_total)
        booking.total_in_pkr = float(grand_total)
        
        booking.save()
        
        # Display
        if hotel_amt > 0:
            print(f"   🏨 Hotel: PKR {hotel_amt:,.0f}")
        if ticket_amt > 0:
            print(f"   ✈️  Ticket: PKR {ticket_amt:,.0f}")
        if transport_amt > 0:
            print(f"   🚌 Transport: PKR {transport_amt:,.0f}")
        if visa_amt > 0:
            print(f"   🎫 Visa: PKR {visa_amt:,.0f}")
        if food_amt > 0:
            print(f"   🍽️  Food: PKR {food_amt:,.0f}")
        if ziyarat_amt > 0:
            print(f"   🕌 Ziyarat: PKR {ziyarat_amt:,.0f}")
        
        print(f"   💰 TOTAL: PKR {grand_total:,.0f}")
    
    print("\n" + "=" * 70)
    print("✅ ALL BOOKINGS FIXED!")
    print("=" * 70)
    
    # Verify the specific booking
    print("\n🔍 VERIFYING PKG83719:")
    booking = Booking.objects.get(booking_number='PKG83719')
    print(f"   total_visa_amount_pkr: PKR {booking.total_visa_amount_pkr:,.0f}")
    print(f"   total_hotel_amount_pkr: PKR {booking.total_hotel_amount_pkr:,.0f}")
    print(f"   total_ticket_amount_pkr: PKR {booking.total_ticket_amount_pkr:,.0f}")
    print(f"   total_in_pkr: PKR {booking.total_in_pkr:,.0f}")
    
    print("\n" + "=" * 70)
    total_revenue = Booking.objects.aggregate(total=Sum('total_in_pkr'))['total'] or 0
    print(f"📊 TOTAL REVENUE: PKR {total_revenue:,.0f}")
    print("=" * 70)

if __name__ == '__main__':
    fix_all_booking_amounts()
