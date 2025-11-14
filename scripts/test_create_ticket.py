#!/usr/bin/env python3
import os
import django
import json
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.serializers import TicketSerializer
from packages.models import Airlines, City
from organization.models import Organization
from django.test import RequestFactory

org = Organization.objects.first()
airline = Airlines.objects.first()
cities = list(City.objects.all()[:2])

print('Found org:', getattr(org, 'id', None))
print('Found airline:', getattr(airline, 'id', None))
print('Found cities:', [c.id for c in cities])

if not (org and airline and len(cities) >= 1):
    print('Missing required data (Organization, Airlines, Cities). Aborting.')
    sys.exit(1)

dep = cities[0]
arr = cities[1] if len(cities) > 1 else cities[0]

payload = {
    'organization': org.id,
    'airline': airline.id,
    'is_meal_included': True,
    'is_refundable': True,
    'pnr': 'PNR-TEST-123',
    'adult_price': 120000,
    'adult_buy_price': 100000,
    'child_price': 90000,
    'child_buy_price': 80000,
    'infant_price': 80000,
    'infant_buy_price': 70000,
    'total_seats': 30,
    'left_seats': 30,
    'weight': 30,
    'pieces': 2,
    'is_umrah_seat': True,
    'trip_type': 'One-way',
    'departure_stay_type': 'Non-Stop',
    'return_stay_type': 'Non-Stop',
    'trip_details': [
        {
            'departure_date_time': '2025-11-05T10:03:00',
            'arrival_date_time': '2025-11-06T10:03:00',
            'trip_type': 'Departure',
            'departure_city': dep.id,
            'arrival_city': arr.id,
        }
    ],
    'stopover_details': [],
}

# Build a fake request to pass into serializer context
rf = RequestFactory()
request = rf.post('/api/tickets/', data=json.dumps(payload), content_type='application/json')

serializer = TicketSerializer(data=payload, context={'request': request})
valid = serializer.is_valid()
print('serializer.is_valid():', valid)
print('serializer.errors:', json.dumps(serializer.errors, default=str, indent=2))

if valid:
    ticket = serializer.save()
    print('Saved ticket id:', ticket.id)
    print('Flight number:', ticket.flight_number)
else:
    sys.exit(2)
