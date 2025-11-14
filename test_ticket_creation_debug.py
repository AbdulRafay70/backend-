"""
Test script to reproduce the ticket creation 500 error
"""
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.serializers import TicketSerializer
from organization.models import Organization

def test_ticket_creation():
    print("Testing ticket creation with frontend-like payload...")

    # Get first organization
    try:
        org = Organization.objects.first()
        if not org:
            print("ERROR: No organizations found in database")
            return
        print(f"Using organization: {org.name} (ID: {org.id})")
    except Exception as e:
        print(f"ERROR getting organization: {e}")
        return

    # Payload similar to what frontend sends (based on AddTicket.jsx)
    payload = {
        'flight_number': 'EK-502',
        'is_meal_included': True,
        'is_refundable': True,
        'pnr': 'N/A',
        'adult_price': 0,
        'child_price': 0,
        'infant_price': 0,
        'adult_fare': 0,
        'child_fare': 0,
        'infant_fare': 0,
        'total_seats': 30,
        'left_seats': 30,
        'baggage_weight': 20.5,
        'baggage_pieces': 2,
        'is_umrah_seat': True,
        'trip_type': 'One-way',
        'departure_stay_type': 'Non-Stop',
        'return_stay_type': 'Non-Stop',
        'organization': org.id,
        'airline': 14,  # Use actual airline ID from database
        'trip_details': [{
            'departure_date_time': '2025-11-15T10:00:00.000Z',
            'arrival_date_time': '2025-11-15T14:00:00.000Z',
            'trip_type': 'Departure',
            'departure_city': 5,  # Use actual city ID from database
            'arrival_city': 7,    # Use actual city ID from database
        }],
        'stopover_details': []
    }

    print("Payload:")
    print(json.dumps(payload, indent=2))

    try:
        serializer = TicketSerializer(data=payload)
        print(f"\nSerializer is_valid(): {serializer.is_valid()}")

        if not serializer.is_valid():
            print("Validation errors:")
            for field, errors in serializer.errors.items():
                print(f"  {field}: {errors}")
        else:
            print("Validation passed, attempting to save...")
            ticket = serializer.save()
            print(f"SUCCESS: Ticket created with ID {ticket.id}")

        # Test with invalid IDs
        print("\nTesting with invalid airline ID...")
        invalid_payload = payload.copy()
        invalid_payload['airline'] = 999  # Invalid airline ID
        
        serializer = TicketSerializer(data=invalid_payload)
        print(f"Invalid airline serializer is_valid(): {serializer.is_valid()}")
        if not serializer.is_valid():
            print("Validation errors:")
            for field, errors in serializer.errors.items():
                print(f"  {field}: {errors}")
        
        print("\nTesting with invalid city IDs...")
        invalid_payload2 = payload.copy()
        invalid_payload2['trip_details'][0]['departure_city'] = 999  # Invalid city ID
        
        serializer2 = TicketSerializer(data=invalid_payload2)
        print(f"Invalid city serializer is_valid(): {serializer2.is_valid()}")
        if not serializer2.is_valid():
            print("Validation errors:")
            for field, errors in serializer2.errors.items():
                print(f"  {field}: {errors}")

    except Exception as e:
        print(f"ERROR during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_ticket_creation()