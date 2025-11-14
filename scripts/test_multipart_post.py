#!/usr/bin/env python3
import os
import django
import json
import sys
from io import BytesIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.test import Client
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from organization.models import Organization
from packages.models import Airlines, City

org = Organization.objects.first()
airline = Airlines.objects.first()
cities = list(City.objects.all()[:2])

print('Using org:', getattr(org,'id',None), 'airline:', getattr(airline,'id',None), 'cities:', [c.id for c in cities])

if not (org and airline and cities):
    print('Missing required data, aborting')
    sys.exit(1)

dep = cities[0]
arr = cities[1] if len(cities)>1 else cities[0]

# Build multipart form data similar to the browser: trip_details as JSON string
payload = {
    'organization': str(org.id),
    'airline': str(airline.id),
    'is_meal_included': 'true',
    'is_refundable': 'true',
    'pnr': 'PNR-MULTI-1',
    'adult_price': '120000',
    'adult_buy_price': '100000',
    'total_seats': '30',
    'left_seats': '30',
    'weight': '30',
    'pieces': '2',
    'is_umrah_seat': 'true',
    'trip_type': 'One-way',
    'departure_stay_type': 'Non-Stop',
    'return_stay_type': 'Non-Stop',
}

trip = [{
    'departure_date_time': '11/05/2025 10:03 AM',
    'arrival_date_time': '11/06/2025 10:03 AM',
    'trip_type': 'Departure',
    'departure_city': str(dep.id),
    'arrival_city': str(arr.id),
}]

payload['trip_details'] = json.dumps(trip)

# Create a fake small file
file_content = BytesIO(b"fake-image-content")
file_content.name = 'logo.png'

c = Client()
# Ensure the testserver host used by Django's test client is allowed so we don't hit DisallowedHost
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS = list(settings.ALLOWED_HOSTS) + ['testserver']

# Authenticate the test client using SimpleJWT for an active user if available
User = get_user_model()
user = User.objects.filter(is_active=True).first()
if user:
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    c.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    print('Authenticated test client as user id', user.id)
else:
    print('No active user found; request will be unauthenticated')
response = c.post(f'/api/tickets/?organization={org.id}', data=payload, files={'airline_logo': file_content})

print('Response status:', response.status_code)
try:
    print('Response data:', response.json())
except Exception:
    print('Response content:', response.content)

# Also validate the payload locally with the serializer to compare errors
try:
    from tickets.serializers import TicketSerializer
    ser = TicketSerializer(data=payload, context={})
    print('Local serializer is_valid:', ser.is_valid())
    print('Local serializer errors:', ser.errors)
except Exception as e:
    print('Local serializer check failed:', e)

if response.status_code >= 400:
    sys.exit(2)
else:
    sys.exit(0)
