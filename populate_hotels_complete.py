"""
Populate Hotels with Complete Data
Includes: Name, City, Address, Category, Contact, Status, Distance, Walk Time, 
Prices (Room, Sharing, Quint, Quad, Triple, Double), Pictures, Location
"""

import os
import django
import sys
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels, HotelPrices
from packages.models import City
from organization.models import Organization

print("="*80)
print("COMPREHENSIVE HOTEL DATA POPULATION")
print("="*80)
print()

# Get organization ORG-0001 (saer.pk)
try:
    org = Organization.objects.get(org_code="ORG-0001")
    print(f"[OK] Using organization: {org.name} (Code: {org.org_code}, ID: {org.id})")
except Organization.DoesNotExist:
    print("[ERROR] Organization ORG-0001 (saer.pk) not found. Please create it first.")
    sys.exit(1)
except Exception as e:
    print(f"[ERROR] Error: {e}")
    sys.exit(1)

print()
print("-"*80)
print("STEP 1: ENSURE CITIES EXIST")
print("-"*80)

cities_data = [
    {"name": "Makkah", "code": "MKH", "country": "Saudi Arabia"},
    {"name": "Madinah", "code": "MDH", "country": "Saudi Arabia"},
]

cities = {}
for city_data in cities_data:
    city, created = City.objects.get_or_create(
        name=city_data["name"],
        defaults={"code": city_data["code"], "organization": org}
    )
    cities[city_data["name"]] = city
    print(f"  {'Created' if created else 'Exists'}: {city.name}")

print()
print("-"*80)
print("STEP 2: CREATE HOTELS WITH COMPLETE DATA")
print("-"*80)

# Complete hotel data
hotels_data = [
    # MAKKAH HOTELS
    {
        "name": "Makkah Clock Royal Tower",
        "city": "Makkah",
        "category": "5 Star",
        "address": "Abraj Al Bait Complex, King Abdul Aziz Road, Makkah 24231, Saudi Arabia",
        "distance_from_haram": 50,
        "walk_time": 1,  # minutes
        "walking_distance": 50,  # meters
        "phone": "+966-12-571-8888",
        "email": "info@clocktower.com",
        "description": "Luxury 5-star hotel with stunning views of the Holy Haram. Located in the iconic Clock Tower complex.",
        "check_in": "14:00",
        "check_out": "12:00",
        "status": "active",
        "latitude": "21.4189",
        "longitude": "39.8262",
        "base_price": 15000,
    },
    {
        "name": "Swissotel Makkah",
        "city": "Makkah",
        "category": "5 Star",
        "address": "Ibrahim Al Khalil Street, Makkah 24231, Saudi Arabia",
        "distance_from_haram": 200,
        "walk_time": 3,
        "walking_distance": 200,
        "phone": "+966-12-520-0000",
        "email": "info@swissotel-makkah.com",
        "description": "Modern luxury hotel offering premium amenities and close proximity to Masjid al-Haram.",
        "check_in": "15:00",
        "check_out": "12:00",
        "status": "active",
        "latitude": "21.4225",
        "longitude": "39.8262",
        "base_price": 15000,
    },
    # MADINAH HOTELS
    {
        "name": "Madinah Hilton",
        "city": "Madinah",
        "category": "5 Star",
        "address": "King Fahd Road, Al Madinah Al Munawwarah 42311, Saudi Arabia",
        "distance_from_haram": 150,
        "walk_time": 2,
        "walking_distance": 150,
        "phone": "+966-14-838-8888",
        "email": "info@hilton-madinah.com",
        "description": "Premium 5-star hotel near the Prophet's Mosque with world-class facilities.",
        "check_in": "14:00",
        "check_out": "12:00",
        "status": "active",
        "latitude": "24.4672",
        "longitude": "39.6111",
        "base_price": 15000,
    },
    {
        "name": "Dar Al Eiman Royal",
        "city": "Madinah",
        "category": "4 Star",
        "address": "Al Masjid An Nabawi Road, Madinah 42311, Saudi Arabia",
        "distance_from_haram": 300,
        "walk_time": 4,
        "walking_distance": 300,
        "phone": "+966-14-822-2222",
        "email": "info@daraleiman.com",
        "description": "Comfortable 4-star hotel offering excellent service and convenient access to the Prophet's Mosque.",
        "check_in": "15:00",
        "check_out": "11:00",
        "status": "active",
        "latitude": "24.4678",
        "longitude": "39.6105",
        "base_price": 10000,
    },
]

# Date ranges for pricing (3 seasons)
today = datetime.now().date()
date_ranges = [
    {"name": "Off Season", "start": today, "end": today + timedelta(days=90)},
    {"name": "Mid Season", "start": today + timedelta(days=91), "end": today + timedelta(days=180)},
    {"name": "Peak Season", "start": today + timedelta(days=181), "end": today + timedelta(days=270)},
]

# Sharing types with pricing calculation
sharing_types = [
    {"name": "Single", "beds": 1, "discount": 0.00},
    {"name": "Double", "beds": 2, "discount": 0.08},
    {"name": "Triple", "beds": 3, "discount": 0.16},
    {"name": "Quad", "beds": 4, "discount": 0.24},
    {"name": "Quint", "beds": 5, "discount": 0.32},
    {"name": "6 Bed Sharing", "beds": 6, "discount": 0.40},
    {"name": "7 Bed Sharing", "beds": 7, "discount": 0.48},
    {"name": "8 Bed Sharing", "beds": 8, "discount": 0.56},
    {"name": "9 Bed Sharing", "beds": 9, "discount": 0.64},
    {"name": "10 Bed Sharing", "beds": 10, "discount": 0.72},
]

def calculate_price(base_price, discount, season_multiplier):
    """Calculate selling and purchasing price"""
    selling = int(base_price * season_multiplier * (1 - discount))
    purchasing = int(selling * 0.75)  # 25% margin
    return selling, purchasing

# Create hotels
for hotel_data in hotels_data:
    city = cities[hotel_data["city"]]
    
    # Create or update hotel
    hotel, created = Hotels.objects.update_or_create(
        name=hotel_data["name"],
        defaults={
            "organization": org,
            "city": city,
            "category": hotel_data["category"],
            "address": hotel_data["address"],
            "distance": hotel_data["distance_from_haram"],
            "walking_distance": hotel_data["walking_distance"],
            "walking_time": hotel_data["walk_time"],
            "contact_number": hotel_data["phone"],
            "google_location": f"{hotel_data.get('latitude', '')},{hotel_data.get('longitude', '')}",
            "status": hotel_data["status"],
            "is_active": True,
        }
    )
    
    print(f"\n{'Created' if created else 'Updated'}: {hotel.name}")
    print(f"  City: {city.name}")
    print(f"  Category: {hotel_data['category']}")
    print(f"  Distance from Haram: {hotel_data['distance_from_haram']}m ({hotel_data['walk_time']} min walk)")
    print(f"  Contact: {hotel_data['phone']} | {hotel_data['email']}")
    print(f"  Status: {hotel_data['status']}")
    
    # Delete existing prices for this hotel to avoid duplicates
    if not created:
        deleted_count = HotelPrices.objects.filter(hotel=hotel).delete()[0]
        if deleted_count > 0:
            print(f"  Deleted {deleted_count} old price entries")
    
    # Create prices for all combinations
    price_count = 0
    for date_range in date_ranges:
        # Season multiplier
        if "Peak" in date_range["name"]:
            season_multiplier = 1.5
        elif "Mid" in date_range["name"]:
            season_multiplier = 1.2
        else:
            season_multiplier = 1.0
        
        for sharing in sharing_types:
            selling, purchasing = calculate_price(
                hotel_data["base_price"],
                sharing["discount"],
                season_multiplier
            )
            
            HotelPrices.objects.create(
                hotel=hotel,
                room_type=sharing["name"],
                start_date=date_range["start"],
                end_date=date_range["end"],
                price=float(selling),
                purchase_price=float(purchasing),
            )
            price_count += 1
    
    print(f"  ✓ Added {price_count} price entries ({len(date_ranges)} seasons × {len(sharing_types)} room types)")

print()
print("="*80)
print("✅ HOTEL DATA POPULATION COMPLETE!")
print("="*80)
print()
print("Summary:")
print(f"  • Total Hotels: {Hotels.objects.count()}")
print(f"  • Total Price Entries: {HotelPrices.objects.count()}")
print()
print("Hotels by City:")
for city_name in ["Makkah", "Madinah"]:
    city = cities.get(city_name)
    if city:
        count = Hotels.objects.filter(city=city).count()
        print(f"  • {city_name}: {count} hotels")
print()
print("Price Breakdown:")
print(f"  • Seasons: {len(date_ranges)}")
print(f"  • Room Types: {len(sharing_types)}")
print(f"  • Prices per Hotel: {len(date_ranges) * len(sharing_types)}")
print()
