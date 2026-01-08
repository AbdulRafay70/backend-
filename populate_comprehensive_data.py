"""
Comprehensive Data Population Script for Umrah Booking System
Populates: Hotels (Makkah & Madinah), Visa, Food, Ziyarat, Transport, Flights, Cities
"""

import os
import django
import sys
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels, HotelCategory, BedType
from packages.models import City, Airlines
from booking.models import (
    VisaPrice, VisaLongPrice, VisaType,
    FoodPrice, ZiyaratPrice,
    BigSector, SmallSector,
    Shirka, HotelPrice
)
from organization.models import Organization

print("="*80)
print("COMPREHENSIVE DATA POPULATION SCRIPT")
print("="*80)
print()

# Get or create default organization
try:
    org = Organization.objects.first()
    if not org:
        print("❌ No organization found. Please create an organization first.")
        sys.exit(1)
    print(f"✅ Using organization: {org.name} (ID: {org.id})")
except Exception as e:
    print(f"❌ Error getting organization: {e}")
    sys.exit(1)

print()
print("-"*80)
print("STEP 1: CITIES")
print("-"*80)

# Create cities
cities_data = [
    {"name": "Makkah", "code": "MKH", "country": "Saudi Arabia"},
    {"name": "Madinah", "code": "MDH", "country": "Saudi Arabia"},
    {"name": "Jeddah", "code": "JED", "country": "Saudi Arabia"},
    {"name": "Karachi", "code": "KHI", "country": "Pakistan"},
    {"name": "Lahore", "code": "LHE", "country": "Pakistan"},
    {"name": "Islamabad", "code": "ISB", "country": "Pakistan"},
]

cities = {}
for city_data in cities_data:
    city, created = City.objects.get_or_create(
        name=city_data["name"],
        defaults={
            "code": city_data["code"],
            "country": city_data.get("country", ""),
        }
    )
    cities[city_data["name"]] = city
    status = "Created" if created else "Exists"
    print(f"  {status}: {city.name} ({city.code})")

print()
print("-"*80)
print("STEP 2: HOTEL CATEGORIES & BED TYPES")
print("-"*80)

# Create hotel categories
categories_data = [
    {"name": "5 Star"},
    {"name": "4 Star"},
    {"name": "3 Star"},
]

categories = {}
for cat_data in categories_data:
    cat, created = HotelCategory.objects.get_or_create(
        name=cat_data["name"],
        defaults={"organization": org}
    )
    categories[cat_data["name"]] = cat
    status = "Created" if created else "Exists"
    print(f"  {status}: {cat.name}")

# Create bed types
bed_types_data = [
    {"name": "Single"},
    {"name": "Double"},
    {"name": "Triple"},
    {"name": "Quad"},
]

bed_types = {}
for bed_data in bed_types_data:
    bed, created = BedType.objects.get_or_create(
        name=bed_data["name"],
        defaults={"organization": org}
    )
    bed_types[bed_data["name"]] = bed
    status = "Created" if created else "Exists"
    print(f"  {status}: {bed.name}")

print()
print("-"*80)
print("STEP 3: HOTELS (2 Makkah + 2 Madinah)")
print("-"*80)

# Hotel data with comprehensive details
hotels_data = [
    # Makkah Hotels
    {
        "name": "Makkah Clock Royal Tower",
        "city": "Makkah",
        "category": "5 Star",
        "address": "Abraj Al Bait Complex, Makkah",
        "distance_from_haram": 50,  # meters
        "phone": "+966-12-571-8888",
        "email": "info@clocktower.com",
        "description": "Luxury hotel overlooking the Holy Haram",
        "check_in": "14:00",
        "check_out": "12:00",
    },
    {
        "name": "Swissotel Makkah",
        "city": "Makkah",
        "category": "5 Star",
        "address": "Ibrahim Al Khalil Street, Makkah",
        "distance_from_haram": 200,
        "phone": "+966-12-520-0000",
        "email": "info@swissotel-makkah.com",
        "description": "Modern luxury hotel near Haram",
        "check_in": "15:00",
        "check_out": "12:00",
    },
    # Madinah Hotels
    {
        "name": "Madinah Hilton",
        "city": "Madinah",
        "category": "5 Star",
        "address": "King Fahd Road, Madinah",
        "distance_from_haram": 150,
        "phone": "+966-14-838-8888",
        "email": "info@hilton-madinah.com",
        "description": "Premium hotel near Prophet's Mosque",
        "check_in": "14:00",
        "check_out": "12:00",
    },
    {
        "name": "Dar Al Eiman Royal",
        "city": "Madinah",
        "category": "4 Star",
        "address": "Al Masjid An Nabawi Road, Madinah",
        "distance_from_haram": 300,
        "phone": "+966-14-822-2222",
        "email": "info@daraleiman.com",
        "description": "Comfortable hotel with excellent service",
        "check_in": "15:00",
        "check_out": "11:00",
    },
]

# Date ranges for pricing (3 seasons)
today = datetime.now().date()
date_ranges = [
    {
        "name": "Off Season",
        "start": today,
        "end": today + timedelta(days=90),
    },
    {
        "name": "Mid Season",
        "start": today + timedelta(days=91),
        "end": today + timedelta(days=180),
    },
    {
        "name": "Peak Season",
        "start": today + timedelta(days=181),
        "end": today + timedelta(days=270),
    },
]

# Pricing matrix for different sharing types (1-10 beds)
def get_pricing_for_sharing(base_price, sharing_count):
    """Calculate pricing based on sharing count"""
    # More sharing = lower price per person
    discount_factor = 1 - (sharing_count - 1) * 0.08  # 8% discount per additional person
    selling = int(base_price * discount_factor)
    purchasing = int(selling * 0.75)  # 25% margin
    return selling, purchasing

hotels = {}
for hotel_data in hotels_data:
    city = cities[hotel_data["city"]]
    category = categories[hotel_data["category"]]
    
    hotel, created = Hotels.objects.get_or_create(
        name=hotel_data["name"],
        city=city,
        defaults={
            "organization": org,
            "category": category.name,  # Store as string
            "address": hotel_data["address"],
            "distance_from_haram": hotel_data["distance_from_haram"],
            "phone_number": hotel_data["phone"],
            "email": hotel_data["email"],
            "description": hotel_data["description"],
            "check_in_time": hotel_data["check_in"],
            "check_out_time": hotel_data["check_out"],
            "status": "active",
        }
    )
    hotels[hotel_data["name"]] = hotel
    status = "Created" if created else "Exists"
    print(f"  {status}: {hotel.name} in {city.name}")
    
    # Add pricing for this hotel
    if created:
        base_price = 15000 if hotel_data["category"] == "5 Star" else 10000
        
        for date_range in date_ranges:
            # Adjust base price for season
            season_multiplier = 1.0
            if "Peak" in date_range["name"]:
                season_multiplier = 1.5
            elif "Mid" in date_range["name"]:
                season_multiplier = 1.2
            
            season_base = int(base_price * season_multiplier)
            
            # Create prices for 1-10 bed sharing
            for sharing in range(1, 11):
                selling, purchasing = get_pricing_for_sharing(season_base, sharing)
                
                HotelPrice.objects.create(
                    hotel=hotel,
                    room_type=f"{sharing} Bed Sharing",
                    start_date=date_range["start"],
                    end_date=date_range["end"],
                    selling_price=Decimal(str(selling)),
                    purchasing_price=Decimal(str(purchasing)),
                    organization=org
                )
        
        print(f"    ✓ Added {len(date_ranges) * 10} price entries (3 seasons × 10 sharing types)")

print()
print("-"*80)
print("STEP 4: VISA TYPES & PRICING")
print("-"*80)

# Visa types
visa_types_data = [
    {"name": "Umrah Visa", "description": "Standard Umrah visa"},
    {"name": "Visit Visa", "description": "Visit visa for family"},
]

for visa_data in visa_types_data:
    visa_type, created = VisaType.objects.get_or_create(
        name=visa_data["name"],
        defaults={
            "description": visa_data.get("description", ""),
            "organization": org
        }
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: {visa_type.name}")

# Visa pricing (Short stay)
visa_prices_data = [
    {"type": "Normal", "selling": 8000, "purchasing": 6000},
    {"type": "Urgent", "selling": 12000, "purchasing": 9000},
    {"type": "Super Urgent", "selling": 15000, "purchasing": 11000},
]

for visa_price_data in visa_prices_data:
    visa_price, created = VisaPrice.objects.get_or_create(
        type=visa_price_data["type"],
        defaults={
            "selling_price": Decimal(str(visa_price_data["selling"])),
            "purchasing_price": Decimal(str(visa_price_data["purchasing"])),
            "organization": org
        }
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: {visa_price.type} - Selling: {visa_price.selling_price}, Purchasing: {visa_price.purchasing_price}")

# Visa pricing (Long stay)
visa_long_prices_data = [
    {"type": "30 Days", "selling": 15000, "purchasing": 12000},
    {"type": "60 Days", "selling": 25000, "purchasing": 20000},
    {"type": "90 Days", "selling": 35000, "purchasing": 28000},
]

for visa_long_data in visa_long_prices_data:
    visa_long, created = VisaLongPrice.objects.get_or_create(
        type=visa_long_data["type"],
        defaults={
            "selling_price": Decimal(str(visa_long_data["selling"])),
            "purchasing_price": Decimal(str(visa_long_data["purchasing"])),
            "organization": org
        }
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: Long Stay {visa_long.type} - Selling: {visa_long.selling_price}, Purchasing: {visa_long.purchasing_price}")

print()
print("-"*80)
print("STEP 5: FOOD PRICING")
print("-"*80)

# Food pricing
food_prices_data = [
    {"type": "Breakfast", "selling": 500, "purchasing": 350},
    {"type": "Lunch", "selling": 800, "purchasing": 600},
    {"type": "Dinner", "selling": 800, "purchasing": 600},
    {"type": "Full Board (3 Meals)", "selling": 2000, "purchasing": 1500},
]

for food_data in food_prices_data:
    food_price, created = FoodPrice.objects.get_or_create(
        type=food_data["type"],
        defaults={
            "selling_price": Decimal(str(food_data["selling"])),
            "purchasing_price": Decimal(str(food_data["purchasing"])),
            "organization": org
        }
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: {food_price.type} - Selling: {food_price.selling_price}, Purchasing: {food_price.purchasing_price}")

print()
print("-"*80)
print("STEP 6: ZIYARAT PRICING")
print("-"*80)

# Ziyarat pricing
ziyarat_prices_data = [
    {"type": "Makkah Ziyarat", "selling": 3000, "purchasing": 2200},
    {"type": "Madinah Ziyarat", "selling": 2500, "purchasing": 1800},
    {"type": "Combined Ziyarat", "selling": 5000, "purchasing": 3800},
]

for ziyarat_data in ziyarat_prices_data:
    ziyarat_price, created = ZiyaratPrice.objects.get_or_create(
        type=ziyarat_data["type"],
        defaults={
            "selling_price": Decimal(str(ziyarat_data["selling"])),
            "purchasing_price": Decimal(str(ziyarat_data["purchasing"])),
            "organization": org
        }
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: {ziyarat_price.type} - Selling: {ziyarat_price.selling_price}, Purchasing: {ziyarat_price.purchasing_price}")

print()
print("-"*80)
print("STEP 7: TRANSPORT SECTORS")
print("-"*80)

# Small Sectors (within cities)
small_sectors_data = [
    {"from_city": "Makkah", "to_city": "Makkah", "name": "Makkah Local", "selling": 500, "purchasing": 350},
    {"from_city": "Madinah", "to_city": "Madinah", "name": "Madinah Local", "selling": 500, "purchasing": 350},
    {"from_city": "Jeddah", "to_city": "Jeddah", "name": "Jeddah Local", "selling": 600, "purchasing": 400},
]

for sector_data in small_sectors_data:
    from_city = cities[sector_data["from_city"]]
    to_city = cities[sector_data["to_city"]]
    
    small_sector, created = SmallSector.objects.get_or_create(
        from_city=from_city,
        to_city=to_city,
        defaults={
            "name": sector_data["name"],
            "selling_price": Decimal(str(sector_data["selling"])),
            "purchasing_price": Decimal(str(sector_data["purchasing"])),
            "organization": org
        }
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: Small Sector - {small_sector.name}")

# Big Sectors (between cities)
big_sectors_data = [
    {"from_city": "Jeddah", "to_city": "Makkah", "name": "Jeddah to Makkah", "selling": 2500, "purchasing": 1800},
    {"from_city": "Makkah", "to_city": "Madinah", "name": "Makkah to Madinah", "selling": 4000, "purchasing": 3000},
    {"from_city": "Madinah", "to_city": "Jeddah", "name": "Madinah to Jeddah", "selling": 4500, "purchasing": 3300},
]

for sector_data in big_sectors_data:
    from_city = cities[sector_data["from_city"]]
    to_city = cities[sector_data["to_city"]]
    
    big_sector, created = BigSector.objects.get_or_create(
        from_city=from_city,
        to_city=to_city,
        defaults={
            "name": sector_data["name"],
            "selling_price": Decimal(str(sector_data["selling"])),
            "purchasing_price": Decimal(str(sector_data["purchasing"])),
            "organization": org
        }
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: Big Sector - {big_sector.name}")

print()
print("-"*80)
print("STEP 8: AIRLINES (SHIRKA)")
print("-"*80)

# Airlines
airlines_data = [
    {"name": "Saudi Airlines", "code": "SV"},
    {"name": "PIA", "code": "PK"},
    {"name": "Emirates", "code": "EK"},
    {"name": "Etihad", "code": "EY"},
]

for airline_data in airlines_data:
    airline, created = Airlines.objects.get_or_create(
        name=airline_data["name"],
        defaults={
            "code": airline_data.get("code", ""),
        }
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: {airline.name} ({airline.code})")

print()
print("="*80)
print("✅ DATA POPULATION COMPLETE!")
print("="*80)
print()
print("Summary:")
print(f"  • Cities: {City.objects.count()}")
print(f"  • Hotels: {Hotels.objects.count()}")
print(f"  • Hotel Prices: {HotelPrice.objects.count()}")
print(f"  • Visa Prices: {VisaPrice.objects.count()}")
print(f"  • Food Prices: {FoodPrice.objects.count()}")
print(f"  • Ziyarat Prices: {ZiyaratPrice.objects.count()}")
print(f"  • Small Sectors: {SmallSector.objects.count()}")
print(f"  • Big Sectors: {BigSector.objects.count()}")
print(f"  • Airlines: {Airlines.objects.count()}")
print()
