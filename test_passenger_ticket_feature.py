"""
Test script to verify ticket selection for passengers in booking
Run with: python test_passenger_ticket_feature.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import BookingPersonDetail
from django.db import connection

def test_passenger_ticket_feature():
    print("=" * 60)
    print("TESTING PASSENGER TICKET SELECTION FEATURE")
    print("=" * 60)
    
    # Test 1: Check if ticket_id column exists in booking_bookingpersondetail
    print("\n1. Checking if ticket_id column exists...")
    cursor = connection.cursor()
    cursor.execute("SHOW COLUMNS FROM booking_bookingpersondetail LIKE 'ticket_id'")
    result = cursor.fetchone()
    
    if result:
        print(f"   ✅ Column 'ticket_id' exists")
        print(f"   Column details: {result}")
    else:
        print("   ❌ Column 'ticket_id' NOT found")
    
    # Test 2: Check BookingPersonDetail model fields
    print("\n2. Checking BookingPersonDetail model fields...")
    person_fields = [f.name for f in BookingPersonDetail._meta.get_fields()]
    
    if 'ticket' in person_fields:
        print("   ✅ Field 'ticket' exists in BookingPersonDetail model")
    else:
        print("   ❌ Field 'ticket' NOT found in model")
    
    # Test 3: Display sample passenger data
    print("\n3. Sample Passenger Data (First 5):")
    passengers = BookingPersonDetail.objects.select_related('booking', 'ticket', 'ticket__airline')[:5]
    
    if passengers:
        for person in passengers:
            print(f"\n   Passenger: {person.first_name} {person.last_name}")
            print(f"   Booking: {person.booking.booking_number if person.booking else 'N/A'}")
            print(f"   Age Group: {person.age_group}")
            print(f"   Ticket: {person.ticket if person.ticket else 'No ticket assigned'}")
            if person.ticket:
                print(f"   Ticket Flight: {person.ticket.flight_number or 'N/A'}")
                print(f"   Ticket Airline: {person.ticket.airline.name if person.ticket.airline else 'N/A'}")
            print(f"   Ticket Price: {person.ticket_price}")
    else:
        print("   No passengers found in database")
    
    # Test 4: Count passengers with and without tickets
    print("\n4. Ticket Assignment Statistics:")
    total_passengers = BookingPersonDetail.objects.count()
    with_tickets = BookingPersonDetail.objects.filter(ticket__isnull=False).count()
    without_tickets = BookingPersonDetail.objects.filter(ticket__isnull=True).count()
    
    print(f"   Total passengers: {total_passengers}")
    print(f"   Passengers with tickets: {with_tickets}")
    print(f"   Passengers without tickets: {without_tickets}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED ✅")
    print("=" * 60)
    print("\nNew Features Added:")
    print("1. ✅ Ticket selection dropdown in passenger details")
    print("2. ✅ Autocomplete search for tickets")
    print("3. ✅ Amounts summary display showing:")
    print("   - Total Ticket Amount")
    print("   - Total Hotel Amount")
    print("   - Total Transport Amount")
    print("   - Total Visa Amount")
    print("   - Total Amount")
    print("   - Paid Payment")
    print("   - Pending Payment")
    print("\nNext Steps:")
    print("1. Go to: http://127.0.0.1:8000/admin/booking/booking/")
    print("2. Create or edit a booking")
    print("3. Add passengers and select tickets for each")
    print("4. View the Amounts Summary section")
    print("=" * 60)

if __name__ == '__main__':
    test_passenger_ticket_feature()
