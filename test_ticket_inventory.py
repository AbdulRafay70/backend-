"""
Test script to verify Ticket Inventory functionality
Run with: python test_ticket_inventory.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Ticket
from packages.models import Airlines, City
from organization.models import Organization, Branch
from datetime import date, time

def test_ticket_inventory():
    print("=" * 60)
    print("TESTING TICKET INVENTORY SYSTEM")
    print("=" * 60)
    
    # Test 1: Check if new fields exist
    print("\n1. Testing Ticket Model Fields...")
    ticket_fields = [f.name for f in Ticket._meta.get_fields()]
    
    required_fields = [
        'flight_number', 'origin', 'destination', 
        'departure_date', 'departure_time', 'arrival_date', 'arrival_time',
        'seat_type', 'adult_fare', 'child_fare', 'infant_fare',
        'baggage_weight', 'baggage_pieces', 'refund_rule',
        'branch', 'created_at', 'updated_at'
    ]
    
    for field in required_fields:
        if field in ticket_fields:
            print(f"   ✅ Field '{field}' exists")
        else:
            print(f"   ❌ Field '{field}' missing")
    
    # Test 2: Check total ticket count
    print("\n2. Checking Ticket Inventory...")
    total_tickets = Ticket.objects.count()
    print(f"   Total tickets in database: {total_tickets}")
    
    # Test 3: Display sample tickets
    print("\n3. Sample Tickets (First 5):")
    tickets = Ticket.objects.all()[:5]
    
    if tickets:
        for ticket in tickets:
            print(f"\n   Ticket ID: {ticket.id}")
            print(f"   Flight: {ticket.flight_number or 'N/A'}")
            print(f"   Airline: {ticket.airline.name if ticket.airline else 'N/A'}")
            print(f"   Route: {ticket.origin.name if ticket.origin else 'N/A'} → {ticket.destination.name if ticket.destination else 'N/A'}")
            print(f"   Departure: {ticket.departure_date or 'N/A'} at {ticket.departure_time or 'N/A'}")
            print(f"   Seat Type: {ticket.seat_type}")
            print(f"   Adult Fare: {ticket.adult_fare}")
            print(f"   Seats: {ticket.left_seats}/{ticket.total_seats}")
            print(f"   Status: {ticket.status}")
            print(f"   Occupancy: {ticket.occupancy_rate:.1f}%")
            print(f"   Available: {ticket.is_available}")
    else:
        print("   No tickets found in database")
    
    # Test 4: Check Airlines and Cities
    print("\n4. Available Airlines:")
    airlines = Airlines.objects.all()[:5]
    for airline in airlines:
        print(f"   - {airline.name} (ID: {airline.id})")
    
    print("\n5. Available Cities:")
    cities = City.objects.all()[:5]
    for city in cities:
        print(f"   - {city.name} (ID: {city.id})")
    
    # Test 5: Check Organizations and Branches
    print("\n6. Available Organizations:")
    organizations = Organization.objects.all()[:3]
    for org in organizations:
        print(f"   - {org.name} (ID: {org.id})")
    
    print("\n7. Available Branches:")
    branches = Branch.objects.all()[:3]
    for branch in branches:
        print(f"   - {branch.name} (ID: {branch.id})")
    
    # Test 6: Test ticket properties
    if tickets:
        print("\n8. Testing Ticket Properties...")
        test_ticket = tickets[0]
        print(f"   Ticket __str__: {test_ticket}")
        print(f"   is_available: {test_ticket.is_available}")
        print(f"   occupancy_rate: {test_ticket.occupancy_rate}%")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED ✅")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Go to: http://127.0.0.1:8000/admin/tickets/ticket/")
    print("2. Add new tickets or use Bulk Upload")
    print("3. Export tickets to CSV")
    print("4. Check integration with Booking system")
    print("=" * 60)

if __name__ == '__main__':
    test_ticket_inventory()
