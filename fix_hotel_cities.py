"""
Fix hotel cities - change Dubai hotels to Makkah/Madinah for Umrah bookings
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels
from packages.models import City

def fix_hotel_cities():
    """Update hotel cities to Makkah/Madinah"""
    
    print("=" * 80)
    print("FIXING HOTEL CITIES")
    print("=" * 80)
    
    # Get or create Makkah and Madinah cities
    makkah, _ = City.objects.get_or_create(name='Makkah')
    madinah, _ = City.objects.get_or_create(name='Madinah')
    
    # Update Dubai hotels to Makkah/Madinah
    dubai_hotels = [
        ('Burj Al Arab', makkah),
        ('Burj Khalifa View Hotel', makkah),
    ]
    
    for hotel_name, city in dubai_hotels:
        try:
            hotel = Hotels.objects.get(name=hotel_name)
            old_city = hotel.city
            hotel.city = city
            hotel.save()
            print(f"✅ {hotel_name}: {old_city} → {city.name}")
        except Hotels.DoesNotExist:
            print(f"❌ Hotel not found: {hotel_name}")
    
    print(f"\n{'='*80}")
    print("✅ HOTEL CITIES UPDATED!")
    print(f"{'='*80}")
    
    # Show all hotels
    print(f"\n📋 ALL HOTELS:")
    for hotel in Hotels.objects.filter(is_active=True).order_by('city__name'):
        city_name = hotel.city.name if hotel.city else "No City"
        print(f"   {hotel.name}: {city_name}")

if __name__ == '__main__':
    fix_hotel_cities()
