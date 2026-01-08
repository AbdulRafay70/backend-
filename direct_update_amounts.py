"""
Use direct SQL update to bypass any model save issues
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from django.db.models import Sum

def direct_update_amounts():
    """Use QuerySet.update() to directly update database"""
    
    print("=" * 70)
    print("DIRECT DATABASE UPDATE OF BOOKING AMOUNTS")
    print("=" * 70)
    
    bookings = Booking.objects.all()
    
    for booking in bookings:
        print(f"\n📋 {booking.booking_number}")
        
        # Calculate amounts
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
            
            adult_price = float(ticket.adult_price or 75000)
            child_price = float(ticket.child_price or 60000)
            infant_price = float(ticket.infant_price or 10000)
            
            ticket_amt += (adults * adult_price) + (children * child_price) + (infants * infant_price)
        
        # Transport
        for transport in booking.transport_details.all():
            if transport.total_amount:
                transport_amt += float(transport.total_amount)
        
        # Visa
        for person in booking.person_details.all():
            if person.visa_price:
                visa_amt += float(person.visa_price)
        
        # Food
        if booking.is_food_included:
            food_amt = float(booking.total_pax * 14 * 500)
        
        # Ziyarat
        if booking.is_ziyarat_included:
            ziyarat_amt = float(booking.total_pax * 3000)
        
        # Calculate total
        grand_total = hotel_amt + ticket_amt + transport_amt + visa_amt + food_amt + ziyarat_amt
        
        # DIRECT UPDATE using QuerySet.update()
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
        
        print(f"   Updated: Visa={visa_amt}, Hotel={hotel_amt}, Ticket={ticket_amt}, Total={grand_total}")
    
    print("\n" + "=" * 70)
    print("✅ ALL BOOKINGS UPDATED VIA DIRECT SQL!")
    print("=" * 70)
    
    # Verify PKG83719
    print("\n🔍 VERIFYING PKG83719:")
    booking = Booking.objects.get(booking_number='PKG83719')
    print(f"   total_visa_amount_pkr: PKR {booking.total_visa_amount_pkr:,.0f}")
    print(f"   total_hotel_amount_pkr: PKR {booking.total_hotel_amount_pkr:,.0f}")
    print(f"   total_ticket_amount_pkr: PKR {booking.total_ticket_amount_pkr:,.0f}")
    print(f"   total_in_pkr: PKR {booking.total_in_pkr:,.0f}")
    
    print("\n" + "=" * 70)

if __name__ == '__main__':
    direct_update_amounts()
