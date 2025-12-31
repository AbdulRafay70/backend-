"""
Script to update hotels with complete information:
- Correct cities
- Google location links
- Contact details
- Contact numbers
- Available start and end dates
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.utils import timezone
from tickets.models import Hotels
from packages.models import City
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("UPDATING HOTEL INFORMATION")
print("="*80)

# Get cities
makkah = City.objects.filter(organization=org, code='MKH').first()
madinah = City.objects.filter(organization=org, code='MDN').first()
jeddah = City.objects.filter(organization=org, code='JED').first()
riyadh = City.objects.filter(organization=org, code='RYD').first()
dubai = City.objects.filter(organization=org, code='DXB').first()

# Define complete hotel information
hotels_info = {
    'Makkah Grand Hotel': {
        'city': makkah,
        'google_location': 'https://maps.google.com/?q=21.4225,39.8262',
        'contact_number': '+966-12-5691234',
        'address': 'Ibrahim Al Khalil Street, Makkah, Saudi Arabia',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Al Safwah Royale Orchid': {
        'city': makkah,
        'google_location': 'https://maps.google.com/?q=21.4231,39.8256',
        'contact_number': '+966-12-5692345',
        'address': 'Clock Tower, Abraj Al Bait, Makkah, Saudi Arabia',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Makkah Clock Tower': {
        'city': makkah,
        'google_location': 'https://maps.google.com/?q=21.4189,39.8256',
        'contact_number': '+966-12-5693456',
        'address': 'Abraj Al Bait Complex, Makkah, Saudi Arabia',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Madinah Hilton': {
        'city': madinah,
        'google_location': 'https://maps.google.com/?q=24.4672,39.6111',
        'contact_number': '+966-14-8221234',
        'address': 'King Fahd Road, Madinah, Saudi Arabia',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Al Madinah Harmony Hotel': {
        'city': madinah,
        'google_location': 'https://maps.google.com/?q=24.4680,39.6120',
        'contact_number': '+966-14-8222345',
        'address': 'Al Masjid An Nabawi Road, Madinah, Saudi Arabia',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Jeddah Marriott': {
        'city': jeddah,
        'google_location': 'https://maps.google.com/?q=21.5433,39.1728',
        'contact_number': '+966-12-6091234',
        'address': 'Al Hamra District, Jeddah, Saudi Arabia',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Riyadh Palace Hotel': {
        'city': riyadh,
        'google_location': 'https://maps.google.com/?q=24.7136,46.6753',
        'contact_number': '+966-11-4651234',
        'address': 'King Fahd Road, Riyadh, Saudi Arabia',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Burj Al Arab': {
        'city': dubai,
        'google_location': 'https://maps.google.com/?q=25.1413,55.1853',
        'contact_number': '+971-4-3017777',
        'address': 'Jumeirah Street, Dubai, UAE',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Atlantis The Palm': {
        'city': dubai,
        'google_location': 'https://maps.google.com/?q=25.1308,55.1173',
        'contact_number': '+971-4-4260000',
        'address': 'Crescent Road, The Palm, Dubai, UAE',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Dubai Marina Hotel': {
        'city': dubai,
        'google_location': 'https://maps.google.com/?q=25.0805,55.1410',
        'contact_number': '+971-4-3991111',
        'address': 'Dubai Marina, Dubai, UAE',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    },
    'Dubai Budget Inn': {
        'city': dubai,
        'google_location': 'https://maps.google.com/?q=25.2048,55.2708',
        'contact_number': '+971-4-2222333',
        'address': 'Deira, Dubai, UAE',
        'available_start_date': '2025-01-01',
        'available_end_date': '2025-12-31'
    }
}

# Update hotels
updated_count = 0
for hotel_name, info in hotels_info.items():
    hotel = Hotels.objects.filter(organization=org, name=hotel_name).first()
    if hotel:
        hotel.city = info['city']
        hotel.google_location = info['google_location']
        hotel.contact_number = info['contact_number']
        hotel.address = info['address']
        hotel.available_start_date = info['available_start_date']
        hotel.available_end_date = info['available_end_date']
        hotel.save()
        
        print(f"✓ Updated: {hotel_name}")
        print(f"  City: {info['city'].name if info['city'] else 'N/A'}")
        print(f"  Contact: {info['contact_number']}")
        print(f"  Available: {info['available_start_date']} to {info['available_end_date']}")
        print()
        updated_count += 1
    else:
        print(f"✗ Not found: {hotel_name}")

print("="*80)
print(f"Updated {updated_count} hotels successfully!")
print("="*80)
