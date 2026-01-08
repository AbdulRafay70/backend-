"""
Script to populate the database with luxury hotels including detailed pricing.
This will add 10 hotels with multiple price dates and room configurations (1-10 bed types).

Usage: python populate_hotels.py
"""

import os
import django
import sys
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels, HotelPrices, HotelContactDetails, HotelPhoto
from packages.models import City
from organization.models import Organization

def get_organization():
    """Get the first organization or create one"""
    org = Organization.objects.first()
    if not org:
        print("No organization found. Creating a default organization...")
        org = Organization.objects.create(
            name="Default Organization",
            email="default@example.com",
            phone_number="+923001234567",
            address="Default Address"
        )
        print(f"Created organization: {org.name}")
    else:
        print(f"Using organization: {org.name} (ID: {org.id})")
    return org

def get_or_create_cities(org):
    """Get existing cities or create them"""
    cities_data = [
        {"name": "Makkah", "code": "MAK"},
        {"name": "Madinah", "code": "MED"},
        {"name": "Jeddah", "code": "JED"},
        {"name": "Dubai", "code": "DXB"},
    ]
    
    cities = {}
    for city_data in cities_data:
        city, created = City.objects.get_or_create(
            organization=org,
            code=city_data["code"],
            defaults={'name': city_data["name"]}
        )
        cities[city_data["code"]] = city
    
    return cities

def create_hotels_with_pricing(org, cities):
    """Create 10 luxury hotels with detailed pricing"""
    print("\n🏨 Creating Luxury Hotels with Detailed Pricing...")
    
    # Define hotels with their details
    hotels_data = [
        {
            "name": "Burj Al Arab",
            "city_code": "DXB",
            "category": "luxury",
            "address": "Jumeirah Beach Road, Dubai, UAE",
            "distance": 0.5,
            "walking_distance": 500,
            "walking_time": 10,
            "google_location": "https://maps.google.com/?q=Burj+Al+Arab",
            "contact": [
                {"person": "Ahmed Hassan", "number": "+971-4-301-7777"},
                {"person": "Fatima Ali", "number": "+971-4-301-7778"}
            ],
            "base_price_range": (80000, 150000),  # PKR per night
        },
        {
            "name": "Burj Khalifa View Hotel",
            "city_code": "DXB",
            "category": "5_star",
            "address": "Downtown Dubai, near Burj Khalifa, UAE",
            "distance": 0.3,
            "walking_distance": 300,
            "walking_time": 5,
            "google_location": "https://maps.google.com/?q=Burj+Khalifa",
            "contact": [
                {"person": "Mohammed Abdullah", "number": "+971-4-888-3888"}
            ],
            "base_price_range": (60000, 120000),
        },
        {
            "name": "Swissotel Makkah",
            "city_code": "MAK",
            "category": "5_star",
            "address": "Ibrahim Al Khalil Street, Makkah, Saudi Arabia",
            "distance": 0.2,
            "walking_distance": 200,
            "walking_time": 3,
            "google_location": "https://maps.google.com/?q=Swissotel+Makkah",
            "contact": [
                {"person": "Abdullah Khan", "number": "+966-12-577-0000"},
                {"person": "Bilal Ahmed", "number": "+966-12-577-0001"}
            ],
            "base_price_range": (50000, 100000),
        },
        {
            "name": "Hilton Makkah Convention Hotel",
            "city_code": "MAK",
            "category": "5_star",
            "address": "Jabal Omar, King Abdul Aziz Road, Makkah",
            "distance": 0.4,
            "walking_distance": 400,
            "walking_time": 7,
            "google_location": "https://maps.google.com/?q=Hilton+Makkah",
            "contact": [
                {"person": "Usman Farooq", "number": "+966-12-556-9000"}
            ],
            "base_price_range": (45000, 95000),
        },
        {
            "name": "Pullman ZamZam Makkah",
            "city_code": "MAK",
            "category": "5_star",
            "address": "Abraj Al Bait Complex, Makkah",
            "distance": 0.05,
            "walking_distance": 50,
            "walking_time": 1,
            "google_location": "https://maps.google.com/?q=Pullman+ZamZam+Makkah",
            "contact": [
                {"person": "Hamza Sheikh", "number": "+966-12-563-5666"},
                {"person": "Zubair Ahmad", "number": "+966-12-563-5667"}
            ],
            "base_price_range": (70000, 130000),
        },
        {
            "name": "Madinah Hilton Hotel",
            "city_code": "MED",
            "category": "5_star",
            "address": "King Fahd Road, Madinah, Saudi Arabia",
            "distance": 0.3,
            "walking_distance": 300,
            "walking_time": 5,
            "google_location": "https://maps.google.com/?q=Madinah+Hilton",
            "contact": [
                {"person": "Hassan Ali", "number": "+966-14-838-8888"}
            ],
            "base_price_range": (40000, 85000),
        },
        {
            "name": "Sheraton Madinah Hotel",
            "city_code": "MED",
            "category": "4_star",
            "address": "Al Madinah Al Munawarah, Madinah",
            "distance": 0.6,
            "walking_distance": 600,
            "walking_time": 10,
            "google_location": "https://maps.google.com/?q=Sheraton+Madinah",
            "contact": [
                {"person": "Imran Malik", "number": "+966-14-822-2222"}
            ],
            "base_price_range": (35000, 75000),
        },
        {
            "name": "Dar Al Eiman Royal Hotel",
            "city_code": "MAK",
            "category": "4_star",
            "address": "Ajyad Street, Makkah, Saudi Arabia",
            "distance": 0.35,
            "walking_distance": 350,
            "walking_time": 6,
            "google_location": "https://maps.google.com/?q=Dar+Al+Eiman+Makkah",
            "contact": [
                {"person": "Tariq Jameel", "number": "+966-12-565-5555"}
            ],
            "base_price_range": (30000, 65000),
        },
        {
            "name": "Elaf Kinda Hotel",
            "city_code": "MAK",
            "category": "3_star",
            "address": "Kudai Area, Makkah, Saudi Arabia",
            "distance": 0.8,
            "walking_distance": 800,
            "walking_time": 12,
            "google_location": "https://maps.google.com/?q=Elaf+Kinda+Makkah",
            "contact": [
                {"person": "Yasir Abbas", "number": "+966-12-545-4545"}
            ],
            "base_price_range": (25000, 55000),
        },
        {
            "name": "Taiba Front Hotel",
            "city_code": "MED",
            "category": "3_star",
            "address": "Al Haram Road, Madinah, Saudi Arabia",
            "distance": 0.5,
            "walking_distance": 500,
            "walking_time": 8,
            "google_location": "https://maps.google.com/?q=Taiba+Madinah",
            "contact": [
                {"person": "Saeed Rahman", "number": "+966-14-826-6666"}
            ],
            "base_price_range": (20000, 50000),
        },
    ]
    
    # Room types with their typical capacities and price multipliers
    room_types = [
        {"type": "room", "capacity": 1, "multiplier": 2.5},  # Standard room price
        {"type": "sharing", "capacity": 8, "multiplier": 1.0},
        {"type": "quint", "capacity": 5, "multiplier": 1.3},
        {"type": "quad", "capacity": 4, "multiplier": 1.5},
        {"type": "triple", "capacity": 3, "multiplier": 1.8},
        {"type": "double", "capacity": 2, "multiplier": 2.2},
        {"type": "single", "capacity": 1, "multiplier": 3.0},
        {"type": "6-bed", "capacity": 6, "multiplier": 1.1},
        {"type": "7-bed", "capacity": 7, "multiplier": 1.05},
        {"type": "8-bed", "capacity": 8, "multiplier": 1.0},
        {"type": "9-bed", "capacity": 9, "multiplier": 0.95},
        {"type": "10-bed", "capacity": 10, "multiplier": 0.9},
        {"type": "suite", "capacity": 2, "multiplier": 4.0},
    ]
    
    hotel_count = 0
    price_count = 0
    
    for hotel_data in hotels_data:
        city = cities.get(hotel_data["city_code"])
        if not city:
            continue
        
        # Create hotel with availability dates and contact
        hotel = Hotels.objects.create(
            organization=org,
            owner_organization_id=org.id,
            name=hotel_data["name"],
            city=city,
            address=hotel_data["address"],
            google_location=hotel_data["google_location"],
            contact_number=hotel_data["contact"][0]["number"],  # Primary contact
            category=hotel_data["category"],
            distance=hotel_data["distance"],
            walking_distance=hotel_data["walking_distance"],
            walking_time=hotel_data["walking_time"],
            available_start_date=datetime.now().date(),
            available_end_date=(datetime.now() + timedelta(days=365)).date(),  # Available for 1 year
            is_active=True,
            reselling_allowed=True,
            status='active',
        )
        
        hotel_count += 1
        print(f"   ✅ Created: {hotel.name} - {city.name} ({hotel_data['category']})")
        
        # Add contact details
        for contact in hotel_data["contact"]:
            HotelContactDetails.objects.create(
                hotel=hotel,
                contact_person=contact["person"],
                contact_number=contact["number"]
            )
        
        # Create pricing for multiple date ranges (next 6 months)
        start_date = datetime.now().date()
        min_price, max_price = hotel_data["base_price_range"]
        
        # Create 3 price periods
        for period in range(3):
            period_start = start_date + timedelta(days=period * 60)  # Every 2 months
            period_end = period_start + timedelta(days=59)
            
            # Add seasonal variation
            if period == 1:  # Peak season
                season_multiplier = 1.3
            elif period == 2:  # Off season
                season_multiplier = 0.85
            else:  # Regular season
                season_multiplier = 1.0
            
            # Create prices for each room type
            for room_type in room_types:
                base_price_per_person = random.randint(int(min_price), int(max_price)) * season_multiplier
                
                # Calculate price based on room type
                price_per_night = base_price_per_person * room_type["multiplier"]
                purchase_price = price_per_night * 0.75  # 25% margin
                
                HotelPrices.objects.create(
                    hotel=hotel,
                    start_date=period_start,
                    end_date=period_end,
                    room_type=room_type["type"],
                    price=price_per_night,
                    purchase_price=purchase_price,
                    is_sharing_allowed=(room_type["capacity"] > 1)
                )
                
                price_count += 1
    
    print(f"   📦 Total: {hotel_count} hotels created with {price_count} price entries")
    return hotel_count, price_count

def main():
    """Main function to populate all hotel data"""
    print("=" * 70)
    print("🏨 Starting Hotels Population with Detailed Pricing")
    print("=" * 70)
    
    try:
        # Get organization
        org = get_organization()
        
        # Get or create cities
        print("\n📋 Setting up Cities...")
        cities = get_or_create_cities(org)
        print(f"   ✅ Cities: {len(cities)}")
        
        # Create hotels with pricing
        hotel_count, price_count = create_hotels_with_pricing(org, cities)
        
        print("\n" + "=" * 70)
        print("✅ Hotels Population Completed Successfully!")
        print("=" * 70)
        print("\n📊 Summary:")
        print(f"   - Hotels: {Hotels.objects.filter(organization=org).count()} total")
        print(f"   - New Hotels Added: {hotel_count}")
        print(f"   - Price Entries: {HotelPrices.objects.filter(hotel__organization=org).count()} total")
        print(f"   - New Prices Added: {price_count}")
        print(f"   - Contact Details: {HotelContactDetails.objects.filter(hotel__organization=org).count()}")
        print("\n✨ Hotels include:")
        print("   - 🌟 Burj Al Arab (Dubai)")
        print("   - 🌟 Burj Khalifa View Hotel (Dubai)")
        print("   - 🕋 Swissotel Makkah")
        print("   - 🕋 Hilton Makkah Convention Hotel")
        print("   - 🕋 Pullman ZamZam Makkah")
        print("   - 🕌 Madinah Hilton Hotel")
        print("   - 🕌 Sheraton Madinah Hotel")
        print("   - And 3 more hotels in Makkah and Madinah")
        print("\n💰 Room Types Available:")
        print("   - Single, Double, Triple, Quad, Quint")
        print("   - Sharing (6, 7, 8, 9, 10 bed)")
        print("   - Suites")
        print("\n📅 Pricing Periods: 3 seasons (Regular, Peak, Off-season)")
        print("\n✨ You can now view these hotels in the admin panel!")
        
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
