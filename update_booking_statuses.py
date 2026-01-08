"""
Update booking statuses and dates for passenger movements and daily operations:
- Set booking status to 'Approved' or 'Confirmed'
- Set visa status for all passengers
- Set proper travel dates
- Set ticket status
- Set hotel check-in/check-out status
- Update person details with proper dates
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail

def update_booking_statuses():
    """Update all booking statuses and dates"""
    
    print("=" * 80)
    print("UPDATING BOOKING STATUSES AND DATES FOR OPERATIONS")
    print("=" * 80)
    
    bookings = Booking.objects.all().order_by('-id')
    
    # Status options
    booking_statuses = ['Confirmed', 'Approved', 'Confirmed']  # More confirmed than approved
    visa_statuses = ['Approved', 'In Process', 'Pending', 'Approved', 'Approved']  # More approved
    ticket_statuses = ['Confirmed', 'Booked', 'Confirmed']
    
    for booking in bookings:
        print(f"\n{'='*80}")
        print(f"📋 {booking.booking_number} ({booking.booking_type})")
        print(f"{'='*80}")
        
        # 1. UPDATE BOOKING STATUS
        old_status = booking.status
        booking.status = random.choice(booking_statuses)
        print(f"   📊 Status: {old_status} → {booking.status}")
        
        # 2. SET TRAVEL DATES
        # Departure: 5-30 days from now
        days_until_departure = random.randint(5, 30)
        departure_date = datetime.now().date() + timedelta(days=days_until_departure)
        
        # Return: 7-21 days after departure
        trip_duration = random.randint(7, 21)
        return_date = departure_date + timedelta(days=trip_duration)
        
        # Set booking date (created date)
        if not booking.date:
            booking.date = datetime.now()
        
        print(f"   📅 Departure: {departure_date}")
        print(f"   📅 Return: {return_date}")
        print(f"   📅 Duration: {trip_duration} days")
        
        # 3. UPDATE PERSON DETAILS (VISA STATUS)
        print(f"\n   👥 Updating {booking.person_details.count()} passengers...")
        
        for person in booking.person_details.all():
            # Set visa status
            old_visa_status = person.visa_status
            person.visa_status = random.choice(visa_statuses)
            
            # Set ticket status
            old_ticket_status = person.ticket_status
            person.ticket_status = random.choice(ticket_statuses)
            
            # Set visa included flag
            person.is_visa_included = True
            
            # Set passport dates if not set
            if not person.date_of_birth:
                # Age based on age_group
                if person.age_group == 'adult':
                    age = random.randint(25, 60)
                elif person.age_group == 'child':
                    age = random.randint(2, 11)
                else:  # infant
                    age = random.randint(0, 1)
                
                person.date_of_birth = datetime.now().date() - timedelta(days=age*365)
            
            # Set passport expiry (should be valid for at least 6 months)
            if not person.passport_expiry_date:
                person.passport_expiry_date = datetime.now().date() + timedelta(days=random.randint(365, 1095))
            
            person.save()
            
            print(f"      - {person.first_name} {person.last_name}: Visa={person.visa_status}, Ticket={person.ticket_status}")
        
        # 4. UPDATE HOTEL DETAILS (CHECK-IN/CHECK-OUT STATUS)
        if booking.hotel_details.exists():
            print(f"\n   🏨 Updating {booking.hotel_details.count()} hotel booking(s)...")
            
            for hotel_detail in booking.hotel_details.all():
                # Set check-in date around departure date
                if hotel_detail.leg_no == 1:
                    # First hotel (Makkah) - check in on departure
                    hotel_detail.check_in_date = departure_date
                else:
                    # Second hotel (Madinah) - check in after first hotel
                    hotel_detail.check_in_date = departure_date + timedelta(days=7)
                
                hotel_detail.check_out_date = hotel_detail.check_in_date + timedelta(days=hotel_detail.number_of_nights)
                
                # Set check-in/check-out status
                # If departure is soon, set to active
                if days_until_departure <= 10:
                    hotel_detail.check_in_status = 'active'
                    hotel_detail.check_out_status = 'inactive'
                else:
                    hotel_detail.check_in_status = 'inactive'
                    hotel_detail.check_out_status = 'inactive'
                
                hotel_detail.save()
                
                print(f"      - {hotel_detail.hotel.name if hotel_detail.hotel else 'Hotel'}: {hotel_detail.check_in_date} to {hotel_detail.check_out_date}")
        
        # 5. UPDATE TICKET DETAILS
        if booking.ticket_details.exists():
            print(f"\n   ✈️  Updating {booking.ticket_details.count()} ticket(s)...")
            
            for ticket_detail in booking.ticket_details.all():
                # Set ticket status
                ticket_detail.status = random.choice(ticket_statuses)
                ticket_detail.save()
                
                print(f"      - Ticket: {ticket_detail.status}, PNR: {ticket_detail.pnr}")
        
        booking.save()
        print(f"\n   ✅ {booking.booking_number} updated successfully!")
    
    print(f"\n{'='*80}")
    print("✅ ALL BOOKINGS UPDATED WITH STATUSES AND DATES!")
    print(f"{'='*80}")
    
    # Summary
    print(f"\n📊 STATUS SUMMARY:")
    
    print(f"\n   Booking Statuses:")
    for status in ['Confirmed', 'Approved', 'Pending', 'Cancelled']:
        count = Booking.objects.filter(status=status).count()
        if count > 0:
            print(f"   - {status}: {count} bookings")
    
    print(f"\n   Visa Statuses:")
    for status in ['Approved', 'In Process', 'Pending', 'Rejected']:
        count = BookingPersonDetail.objects.filter(visa_status=status).count()
        if count > 0:
            print(f"   - {status}: {count} passengers")
    
    print(f"\n   Ticket Statuses:")
    for status in ['Confirmed', 'Booked', 'Pending', 'Cancelled']:
        count = BookingPersonDetail.objects.filter(ticket_status=status).count()
        if count > 0:
            print(f"   - {status}: {count} passengers")
    
    # Upcoming departures
    print(f"\n   📅 Upcoming Departures (Next 7 Days):")
    upcoming_count = 0
    today = datetime.now().date()
    next_week = today + timedelta(days=7)
    
    for booking in Booking.objects.all():
        if booking.hotel_details.exists():
            first_hotel = booking.hotel_details.order_by('leg_no').first()
            if first_hotel and first_hotel.check_in_date:
                if today <= first_hotel.check_in_date <= next_week:
                    upcoming_count += 1
                    print(f"   - {booking.booking_number}: {first_hotel.check_in_date} ({booking.total_pax} pax)")
    
    if upcoming_count == 0:
        print(f"   - No departures in next 7 days")
    
    print(f"\n{'='*80}")
    print("🎯 BOOKINGS READY FOR PASSENGER MOVEMENTS & DAILY OPERATIONS!")
    print(f"{'='*80}")

if __name__ == '__main__':
    update_booking_statuses()
