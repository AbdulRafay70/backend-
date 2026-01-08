"""
Update all bookings with proper amounts and details for:
- Hotel prices
- Ticket prices
- Transport prices
- Visa prices
- Food prices
- Ziyarat prices
- Total amounts
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
from django.db.models import Sum, Q

def update_booking_amounts():
    """Update all bookings with proper amounts"""
    
    print("=" * 60)
    print("Updating Booking Amounts and Details")
    print("=" * 60)
    
    # Get all bookings
    bookings = Booking.objects.all().order_by('-id')
    
    for booking in bookings:
        print(f"\n📋 Processing Booking: {booking.booking_number}")
        print(f"   Type: {booking.booking_type}")
        print(f"   Passengers: {booking.total_pax}")
        
        # Initialize amounts
        total_hotel_amount = 0
        total_ticket_amount = 0
        total_transport_amount = 0
        total_visa_amount = 0
        total_food_amount = 0
        total_ziyarat_amount = 0
        
        # 1. Update Hotel Details and Amounts
        hotel_details = booking.hotel_details.all()
        if hotel_details.exists():
            print(f"   🏨 Updating {hotel_details.count()} hotel booking(s)...")
            for hotel_detail in hotel_details:
                # Calculate hotel amount based on nights, rooms, and price
                if hotel_detail.total_price and hotel_detail.total_price > 0:
                    total_hotel_amount += hotel_detail.total_price
                else:
                    # Calculate if not set
                    nights = hotel_detail.number_of_nights or 7
                    quantity = hotel_detail.quantity or 1
                    price = hotel_detail.price or 3000
                    calculated_total = nights * quantity * price
                    hotel_detail.total_price = calculated_total
                    hotel_detail.save()
                    total_hotel_amount += calculated_total
                    print(f"      - {hotel_detail.hotel.name if hotel_detail.hotel else 'Hotel'}: PKR {calculated_total:,.0f}")
        
        # 2. Update Ticket Details and Amounts
        ticket_details = booking.ticket_details.all()
        if ticket_details.exists():
            print(f"   ✈️  Updating {ticket_details.count()} ticket booking(s)...")
            for ticket_detail in ticket_details:
                # Calculate ticket amount
                adults = booking.total_adult or 0
                children = booking.total_child or 0
                infants = booking.total_infant or 0
                
                adult_price = ticket_detail.adult_price or 75000
                child_price = ticket_detail.child_price or 60000
                infant_price = ticket_detail.infant_price or 10000
                
                ticket_amount = (adults * adult_price) + (children * child_price) + (infants * infant_price)
                total_ticket_amount += ticket_amount
                print(f"      - Ticket: PKR {ticket_amount:,.0f} ({adults}A x {adult_price}, {children}C x {child_price}, {infants}I x {infant_price})")
        
        # 3. Update Transport Details and Amounts
        transport_details = booking.transport_details.all()
        if transport_details.exists():
            print(f"   🚌 Updating {transport_details.count()} transport booking(s)...")
            for transport_detail in transport_details:
                # Calculate transport amount
                transport_price = transport_detail.price or 2000
                pax = booking.total_pax or 1
                transport_amount = transport_price * pax
                
                if not transport_detail.total_amount or transport_detail.total_amount == 0:
                    transport_detail.total_amount = transport_amount
                    transport_detail.save()
                
                total_transport_amount += transport_detail.total_amount or transport_amount
                print(f"      - Transport: PKR {transport_amount:,.0f}")
        
        # 4. Update Visa Amounts (from person details)
        person_details = booking.person_details.all()
        if person_details.exists():
            print(f"   🎫 Updating visa for {person_details.count()} passenger(s)...")
            for person in person_details:
                # Set visa prices based on age group
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
                
                total_visa_amount += person.visa_price
            
            print(f"      - Total Visa: PKR {total_visa_amount:,.0f}")
        
        # 5. Update Food Amounts (estimate based on passengers and days)
        if booking.is_food_included:
            # Estimate: 500 PKR per person per day for 14 days
            days = 14
            food_per_person_per_day = 500
            total_food_amount = booking.total_pax * days * food_per_person_per_day
            print(f"   🍽️  Food: PKR {total_food_amount:,.0f} ({booking.total_pax} pax x {days} days)")
        
        # 6. Update Ziyarat Amounts
        if booking.is_ziyarat_included:
            # Estimate: 3000 PKR per person (Makkah + Madinah)
            ziyarat_per_person = 3000
            total_ziyarat_amount = booking.total_pax * ziyarat_per_person
            print(f"   🕌 Ziyarat: PKR {total_ziyarat_amount:,.0f} ({booking.total_pax} pax)")
        
        # 7. Update Booking Totals
        booking.total_hotel_amount_pkr = total_hotel_amount
        booking.total_ticket_amount_pkr = total_ticket_amount
        booking.total_transport_amount_pkr = total_transport_amount
        booking.total_visa_amount_pkr = total_visa_amount
        booking.total_food_amount_pkr = total_food_amount
        booking.total_ziyarat_amount_pkr = total_ziyarat_amount
        
        # Calculate grand total
        grand_total = (
            total_hotel_amount +
            total_ticket_amount +
            total_transport_amount +
            total_visa_amount +
            total_food_amount +
            total_ziyarat_amount
        )
        
        # Update total_amount and total_in_pkr
        booking.total_amount = grand_total
        booking.total_in_pkr = grand_total
        
        booking.save()
        
        print(f"\n   💰 TOTALS:")
        print(f"      Hotel:     PKR {total_hotel_amount:>12,.0f}")
        print(f"      Tickets:   PKR {total_ticket_amount:>12,.0f}")
        print(f"      Transport: PKR {total_transport_amount:>12,.0f}")
        print(f"      Visa:      PKR {total_visa_amount:>12,.0f}")
        print(f"      Food:      PKR {total_food_amount:>12,.0f}")
        print(f"      Ziyarat:   PKR {total_ziyarat_amount:>12,.0f}")
        print(f"      " + "=" * 40)
        print(f"      TOTAL:     PKR {grand_total:>12,.0f}")
        print(f"   ✅ Updated successfully!")
    
    print("\n" + "=" * 60)
    print("✅ ALL BOOKINGS UPDATED SUCCESSFULLY!")
    print("=" * 60)
    
    # Summary
    total_bookings = Booking.objects.count()
    total_revenue = Booking.objects.aggregate(total=Sum('total_in_pkr'))['total'] or 0
    
    print(f"\n📊 SUMMARY:")
    print(f"   Total Bookings: {total_bookings}")
    print(f"   Total Revenue:  PKR {total_revenue:,.0f}")
    print(f"\n   Breakdown by Type:")
    
    for booking_type in ['Umrah Package', 'HOTEL', 'Group Ticket', 'OTHER']:
        count = Booking.objects.filter(booking_type=booking_type).count()
        revenue = Booking.objects.filter(booking_type=booking_type).aggregate(total=Sum('total_in_pkr'))['total'] or 0
        if count > 0:
            print(f"   - {booking_type:15s}: {count:2d} bookings, PKR {revenue:>12,.0f}")

if __name__ == '__main__':
    update_booking_amounts()
