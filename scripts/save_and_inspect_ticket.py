#!/usr/bin/env python3
import os
import django
import json
import sys
from io import BytesIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Organization
from packages.models import Airlines, City
from tickets.serializers import TicketSerializer
from django.contrib.auth import get_user_model

# Find required objects
org = Organization.objects.first()
airline = Airlines.objects.first()
cities = list(City.objects.all()[:2])

print('org id:', getattr(org, 'id', None))
print('airline id:', getattr(airline, 'id', None))
print('cities:', [c.id for c in cities])

if not (org and airline and cities):
    print('Missing required data, aborting')
    sys.exit(1)

# Build a payload that mimics the frontend (no file upload here)
payload = {
    'organization': org.id,
    'airline': airline.id,
    'is_meal_included': True,
    'is_refundable': True,
    'pnr': 'AUTO-TEST-1',
    'adult_price': 120000,
    'adult_buy_price': 100000,
    'total_seats': 10,
    'left_seats': 10,
    'weight': 20,
    'pieces': 1,
    'is_umrah_seat': False,
    'trip_type': 'One-way',
    'departure_stay_type': 'Non-Stop',
    'return_stay_type': 'Non-Stop',
}

# Trip details as list of dicts
dep = cities[0]
arr = cities[1] if len(cities) > 1 else cities[0]
trip = [{
    'departure_date_time': '11/05/2025 10:03 AM',
    'arrival_date_time': '11/05/2025 12:03 PM',
    'trip_type': 'Departure',
    'departure_city': str(dep.id),
    'arrival_city': str(arr.id),
}]

# Provide trip_details as a Python list (serializer will handle normalization)
payload['trip_details'] = trip

print('\nPayload to validate (keys):', list(payload.keys()))

# Validate using serializer (no request context required for this save path)
serializer = TicketSerializer(data=payload, context={})
valid = serializer.is_valid()
print('\nSerializer is_valid():', valid)
print('Serializer errors:', serializer.errors)

if not valid:
    print('Not valid; exiting with code 2')
    sys.exit(2)

# Save (this calls serializer.create and will create Ticket + TripDetails)
try:
    ticket = serializer.save()
    print('\nSaved Ticket id:', ticket.id)
    print('Ticket origin id:', getattr(ticket, 'origin_id', None))
    print('Ticket destination id:', getattr(ticket, 'destination_id', None))
    # Count created trip details
    tcount = ticket.trip_details.count()
    print('TripDetails created:', tcount)
    for t in ticket.trip_details.all():
        print(' - trip:', t.id, t.departure_date_time, t.arrival_date_time, t.departure_city_id, t.arrival_city_id)
except Exception as e:
    print('Exception during serializer.save():', e)
    raise

print('\nDone')
