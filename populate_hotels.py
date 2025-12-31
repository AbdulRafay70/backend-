"""
Script to populate the database with hotels in Saudi Arabia and Dubai,
including hotel categories, bed types (1-10 persons), and hotel prices
for different date ranges.
"""
import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.utils import timezone
from tickets.models import Hotels, HotelCategory, BedType, HotelPrices
from packages.models import City
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("CREATING HOTEL DATA FOR ORGANIZATION 11")
print("="*80)

# Create cities for Saudi Arabia and Dubai
print("\n1. Creating cities...")
cities_data = [
    {'code': 'MKH', 'name': 'Makkah'},
    {'code': 'MDN', 'name': 'Madinah'},
    {'code': 'JED', 'name': 'Jeddah'},
    {'code': 'RYD', 'name': 'Riyadh'},
    {'code': 'DXB', 'name': 'Dubai'},
]

cities = {}
for city_data in cities_data:
    city = City.objects.filter(organization=org, code=city_data['code']).first()
    if not city:
        city = City.objects.create(organization=org, **city_data)
        print(f"   Created city: {city_data['name']}")
    else:
        print(f"   Found city: {city_data['name']}")
    cities[city_data['code']] = city

# Create hotel categories
print("\n2. Creating hotel categories...")
categories_data = [
    {'name': '3 Star', 'slug': '3-star'},
    {'name': '4 Star', 'slug': '4-star'},
    {'name': '5 Star', 'slug': '5-star'},
    {'name': 'Budget', 'slug': 'budget'},
    {'name': 'Luxury', 'slug': 'luxury'},
    {'name': 'Premium', 'slug': 'premium'},
]

categories = {}
for cat_data in categories_data:
    cat = HotelCategory.objects.filter(organization=org, slug=cat_data['slug']).first()
    if not cat:
        cat = HotelCategory.objects.create(organization=org, **cat_data)
        print(f"   Created category: {cat_data['name']}")
    else:
        print(f"   Found category: {cat_data['name']}")
    categories[cat_data['slug']] = cat

# Create bed types from 1 to 10 persons
print("\n3. Creating bed types (1-10 persons)...")
bed_types = {}
bed_type_names = {
    1: 'Single',
    2: 'Double',
    3: 'Triple',
    4: 'Quad',
    5: 'Quint',
    6: 'Six Bed',
    7: 'Seven Bed',
    8: 'Eight Bed',
    9: 'Nine Bed',
    10: 'Ten Bed'
}

for capacity, name in bed_type_names.items():
    slug = name.lower().replace(' ', '-')
    bed_type = BedType.objects.filter(organization=org, slug=slug).first()
    if not bed_type:
        bed_type = BedType.objects.create(
            organization=org,
            name=name,
            slug=slug,
            capacity=capacity
        )
        print(f"   Created bed type: {name} ({capacity} person)")
    else:
        print(f"   Found bed type: {name} ({capacity} person)")
    bed_types[capacity] = bed_type

# Create hotels in Saudi Arabia
print("\n4. Creating hotels in Saudi Arabia...")
saudi_hotels_data = [
    {
        'name': 'Makkah Grand Hotel',
        'city': 'MKH',
        'category': '5-star',
        'star_rating': 5,
        'distance': 0.5,
        'walking_time': 10
    },
    {
        'name': 'Al Safwah Royale Orchid',
        'city': 'MKH',
        'category': 'luxury',
        'star_rating': 5,
        'distance': 0.3,
        'walking_time': 5
    },
    {
        'name': 'Makkah Clock Tower',
        'city': 'MKH',
        'category': 'premium',
        'star_rating': 5,
        'distance': 0.1,
        'walking_time': 2
    },
    {
        'name': 'Madinah Hilton',
        'city': 'MDN',
        'category': '5-star',
        'star_rating': 5,
        'distance': 0.8,
        'walking_time': 15
    },
    {
        'name': 'Al Madinah Harmony Hotel',
        'city': 'MDN',
        'category': '4-star',
        'star_rating': 4,
        'distance': 1.2,
        'walking_time': 20
    },
    {
        'name': 'Jeddah Marriott',
        'city': 'JED',
        'category': '5-star',
        'star_rating': 5,
        'distance': 5.0,
        'walking_time': None
    },
    {
        'name': 'Riyadh Palace Hotel',
        'city': 'RYD',
        'category': '4-star',
        'star_rating': 4,
        'distance': 10.0,
        'walking_time': None
    },
]

# Create hotels in Dubai
print("\n5. Creating hotels in Dubai...")
dubai_hotels_data = [
    {
        'name': 'Burj Al Arab',
        'city': 'DXB',
        'category': 'luxury',
        'star_rating': 5,
        'distance': 15.0,
        'walking_time': None
    },
    {
        'name': 'Atlantis The Palm',
        'city': 'DXB',
        'category': 'luxury',
        'star_rating': 5,
        'distance': 20.0,
        'walking_time': None
    },
    {
        'name': 'Dubai Marina Hotel',
        'city': 'DXB',
        'category': '4-star',
        'star_rating': 4,
        'distance': 12.0,
        'walking_time': None
    },
    {
        'name': 'Dubai Budget Inn',
        'city': 'DXB',
        'category': 'budget',
        'star_rating': 3,
        'distance': 25.0,
        'walking_time': None
    },
]

all_hotels_data = saudi_hotels_data + dubai_hotels_data
hotels = []

for hotel_data in all_hotels_data:
    city = cities[hotel_data['city']]
    category = categories[hotel_data['category']]
    
    hotel = Hotels.objects.filter(
        organization=org,
        name=hotel_data['name'],
        city=city
    ).first()
    
    if not hotel:
        # Map category slug to CATEGORY_CHOICES value
        category_map = {
            '5-star': '5_star',
            '4-star': '4_star',
            '3-star': '3_star',
            'luxury': 'luxury',
            'premium': 'deluxe',
            'budget': 'budget'
        }
        
        hotel = Hotels.objects.create(
            organization=org,
            name=hotel_data['name'],
            city=city,
            category=category_map.get(hotel_data['category'], 'standard'),
            address=f"{hotel_data['name']}, {city.name}",
            distance=hotel_data['distance'],
            walking_time=hotel_data['walking_time'] if hotel_data['walking_time'] else 0,
            status='active'
        )
        print(f"   Created hotel: {hotel_data['name']} in {city.name}")
    else:
        print(f"   Found hotel: {hotel_data['name']} in {city.name}")
    
    hotels.append(hotel)

# Create hotel prices for different date ranges and all bed types
print("\n6. Creating hotel prices for all bed types (1-10 persons)...")
print("   This will create prices for 3 different date ranges per hotel...")

today = timezone.now().date()
date_ranges = [
    {
        'name': 'Current Season',
        'check_in': today,
        'check_out': today + timedelta(days=90),
        'price_multiplier': 1.0
    },
    {
        'name': 'Peak Season',
        'check_in': today + timedelta(days=91),
        'check_out': today + timedelta(days=180),
        'price_multiplier': 1.5
    },
    {
        'name': 'Off Season',
        'check_in': today + timedelta(days=181),
        'check_out': today + timedelta(days=365),
        'price_multiplier': 0.8
    },
]

prices_created = 0

for hotel in hotels:
    # Base price depends on hotel category
    category_prices = {
        '5_star': 10000,
        '4_star': 8000,
        '3_star': 6000,
        'luxury': 15000,
        'deluxe': 12000,
        'budget': 4000,
        'standard': 5000
    }
    
    base_price = category_prices.get(hotel.category, 5000)
    
    for date_range in date_ranges:
        # Map bed type capacity to room_type choices
        room_type_map = {
            1: 'single',
            2: 'double',
            3: 'triple',
            4: 'quad',
            5: 'quint',
            6: '6-bed',
            7: '7-bed',
            8: '8-bed',
            9: '9-bed',
            10: '10-bed'
        }
        
        for capacity, bed_type in bed_types.items():
            room_type = room_type_map.get(capacity, 'room')
            
            # Price increases with bed capacity
            room_price = base_price * date_range['price_multiplier'] * (1 + (capacity - 1) * 0.15)
            purchase_price = room_price * 0.8  # 20% margin
            
            # Check if price already exists
            existing_price = HotelPrices.objects.filter(
                hotel=hotel,
                room_type=room_type,
                start_date=date_range['check_in'],
                end_date=date_range['check_out']
            ).first()
            
            if not existing_price:
                HotelPrices.objects.create(
                    hotel=hotel,
                    room_type=room_type,
                    price=round(room_price, 2),
                    purchase_price=round(purchase_price, 2),
                    start_date=date_range['check_in'],
                    end_date=date_range['check_out'],
                    is_sharing_allowed=(capacity >= 2)
                )
                prices_created += 1

print(f"   Created {prices_created} hotel price entries")

# Summary
print("\n" + "="*80)
print("SUMMARY")
print("="*80)
print(f"✅ Cities: {len(cities)}")
print(f"✅ Hotel Categories: {len(categories)}")
print(f"✅ Bed Types: {len(bed_types)} (1-10 persons)")
print(f"✅ Hotels: {len(hotels)}")
print(f"   - Saudi Arabia: {len(saudi_hotels_data)}")
print(f"   - Dubai: {len(dubai_hotels_data)}")
print(f"✅ Hotel Prices: {prices_created}")
print(f"   - Per hotel: {len(date_ranges)} date ranges × {len(bed_types)} bed types = {len(date_ranges) * len(bed_types)} prices")
print("\n" + "="*80)
print("All hotel data created successfully!")
print("="*80)
