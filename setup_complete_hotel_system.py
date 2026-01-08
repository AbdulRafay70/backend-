"""
Complete Hotel System Setup Script
This script will:
1. Clear existing hotels from the database
2. Set up cities, categories, and bed types
3. Create hotels with comprehensive pricing (purchase & sell prices)
4. Add sharing and room prices for bed types 1-10

Usage: python setup_complete_hotel_system.py
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

from tickets.models import (
    Hotels, HotelPrices, HotelContactDetails, HotelPhoto, 
    HotelCategory, BedType
)
from packages.models import City
from organization.models import Organization

def get_saer_organization():
    """Get the SAER organization (ORG-0001)"""
    try:
        org = Organization.objects.get(org_code="ORG-0001")
        print(f"✅ Found organization: {org.name} ({org.org_code})")
        return org
    except Organization.DoesNotExist:
        print("❌ Organization ORG-0001 not found. Creating it...")
        org = Organization.objects.create(
            org_code="ORG-0001",
            name="saer.pk",
            email="admin@saer.pk",
            phone_number="+92-300-1234567",
            address="Karachi, Pakistan"
        )
        print(f"✅ Created organization: {org.name} ({org.org_code})")
        return org

def clear_existing_hotels():
    """Clear all existing hotel data"""
    print("\n🗑️ Clearing existing hotel data...")
    
    # Get counts before deletion
    hotels_count = Hotels.objects.count()
    prices_count = HotelPrices.objects.count()
    contacts_count = HotelContactDetails.objects.count()
    photos_count = HotelPhoto.objects.count()
    
    print(f"Found:")
    print(f"  - {hotels_count} hotels")
    print(f"  - {prices_count} price entries")
    print(f"  - {contacts_count} contact details")
    print(f"  - {photos_count} photos")
    
    if hotels_count > 0:
        # Delete all (cascading will handle related objects)
        Hotels.objects.all().delete()
        print("✅ All hotels and related data cleared!")
    else:
        print("ℹ️ No existing hotels found.")

def create_cities(org):
    """Create required cities"""
    print("\n🏙️ Setting up cities...")
    
    cities_data = [
        {"name": "Makkah", "code": "MAK"},
        {"name": "Madinah", "code": "MED"},
        {"name": "Jeddah", "code": "JED"},
        {"name": "Dubai", "code": "DXB"},
        {"name": "Riyadh", "code": "RUH"},
        {"name": "Abu Dhabi", "code": "AUH"},
        {"name": "Karachi", "code": "KHI"},
        {"name": "Lahore", "code": "LHE"},
    ]
    
    cities = {}
    for city_data in cities_data:
        city, created = City.objects.get_or_create(
            organization=org,
            code=city_data["code"],
            defaults={'name': city_data["name"]}
        )
        if created:
            print(f"  ✅ Created city: {city.name} ({city.code})")
        else:
            print(f"  ℹ️ City exists: {city.name} ({city.code})")
        cities[city_data["code"]] = city
    
    return cities

def create_hotel_categories(org):
    """Create hotel categories"""
    print("\n🏨 Setting up hotel categories...")
    
    categories_data = [
        {"name": "Economy", "slug": "economy"},
        {"name": "Budget", "slug": "budget"},
        {"name": "Standard", "slug": "standard"},
        {"name": "Deluxe", "slug": "deluxe"},
        {"name": "Luxury", "slug": "luxury"},
        {"name": "5 Star", "slug": "5_star"},
        {"name": "4 Star", "slug": "4_star"},
        {"name": "3 Star", "slug": "3_star"},
        {"name": "2 Star", "slug": "2_star"},
    ]
    
    categories = {}
    for cat_data in categories_data:
        category, created = HotelCategory.objects.get_or_create(
            organization=org,
            slug=cat_data["slug"],
            defaults={'name': cat_data["name"]}
        )
        if created:
            print(f"  ✅ Created category: {category.name}")
        else:
            print(f"  ℹ️ Category exists: {category.name}")
        categories[cat_data["slug"]] = category
    
    return categories

def create_bed_types(org):
    """Create bed types 1-10"""
    print("\n🛏️ Setting up bed types (1-10)...")
    
    bed_types_data = [
        {"name": "Single", "slug": "single", "capacity": 1},
        {"name": "Sharing", "slug": "sharing", "capacity": 2},
        {"name": "Double", "slug": "double", "capacity": 2},
        {"name": "Triple", "slug": "triple", "capacity": 3},
        {"name": "Quad", "slug": "quad", "capacity": 4},
        {"name": "Quint", "slug": "quint", "capacity": 5},
        {"name": "6 Bed", "slug": "6_bed", "capacity": 6},
        {"name": "7 Bed", "slug": "7_bed", "capacity": 7},
        {"name": "8 Bed", "slug": "8_bed", "capacity": 8},
        {"name": "9 Bed", "slug": "9_bed", "capacity": 9},
        {"name": "10 Bed", "slug": "10_bed", "capacity": 10},
    ]
    
    bed_types = {}
    for bed_data in bed_types_data:
        bed_type, created = BedType.objects.get_or_create(
            organization=org,
            slug=bed_data["slug"],
            defaults={
                'name': bed_data["name"],
                'capacity': bed_data["capacity"]
            }
        )
        if created:
            print(f"  ✅ Created bed type: {bed_type.name} (Capacity: {bed_type.capacity})")
        else:
            print(f"  ℹ️ Bed type exists: {bed_type.name} (Capacity: {bed_type.capacity})")
        bed_types[bed_data["slug"]] = bed_type
    
    return bed_types

def create_hotels_with_comprehensive_pricing(org, cities, categories):
    """Create hotels with comprehensive pricing for all bed types"""
    print("\n🏨 Creating hotels with comprehensive pricing...")
    
    # Hotel data
    hotels_data = [
        {
            "name": "Burj Al Arab Dubai",
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
            "base_price_range": (100000, 200000),  # PKR per night
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
            "base_price_range": (60000, 120000),
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
            "base_price_range": (50000, 100000),
        },
        {
            "name": "Pullman ZamZam Makkah",
            "city_code": "MAK",
            "category": "4_star",
            "address": "Abraj Al Bait Complex, Makkah, Saudi Arabia",
            "distance": 0.1,
            "walking_distance": 100,
            "walking_time": 2,
            "google_location": "https://maps.google.com/?q=Pullman+ZamZam+Makkah",
            "contact": [
                {"person": "Omar Ali", "number": "+966-12-571-8000"}
            ],
            "base_price_range": (45000, 90000),
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
            "distance": 0.4,
            "walking_distance": 400,
            "walking_time": 6,
            "google_location": "https://maps.google.com/?q=Sheraton+Madinah",
            "contact": [
                {"person": "Ibrahim Rahman", "number": "+966-14-846-7777"}
            ],
            "base_price_range": (35000, 75000),
        },
        {
            "name": "Taiba Madinah Hotel",
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
        {
            "name": "Grand Hyatt Dubai",
            "city_code": "DXB",
            "category": "5_star",
            "address": "Dubai Creek Golf & Yacht Club, Dubai, UAE",
            "distance": 1.2,
            "walking_distance": 1200,
            "walking_time": 15,
            "google_location": "https://maps.google.com/?q=Grand+Hyatt+Dubai",
            "contact": [
                {"person": "Khalid Al Mansouri", "number": "+971-4-317-1234"}
            ],
            "base_price_range": (70000, 140000),
        },
        {
            "name": "Jeddah Intercontinental",
            "city_code": "JED",
            "category": "5_star",
            "address": "Corniche Road, Jeddah, Saudi Arabia",
            "distance": 2.0,
            "walking_distance": 2000,
            "walking_time": 25,
            "google_location": "https://maps.google.com/?q=Intercontinental+Jeddah",
            "contact": [
                {"person": "Fahad Al Zahrani", "number": "+966-12-661-8000"}
            ],
            "base_price_range": (55000, 110000),
        },
        {
            "name": "Riyadh Marriott Hotel",
            "city_code": "RUH",
            "category": "4_star",
            "address": "King Abdullah Road, Riyadh, Saudi Arabia",
            "distance": 0.8,
            "walking_distance": 800,
            "walking_time": 10,
            "google_location": "https://maps.google.com/?q=Marriott+Riyadh",
            "contact": [
                {"person": "Sultan Al Rashid", "number": "+966-11-477-9000"}
            ],
            "base_price_range": (45000, 95000),
        },
    ]
    
    # Room types with pricing multipliers
    room_types = [
        {"type": "single", "multiplier": 2.5, "is_sharing": False},
        {"type": "sharing", "multiplier": 1.0, "is_sharing": True},
        {"type": "double", "multiplier": 1.8, "is_sharing": False},
        {"type": "triple", "multiplier": 1.4, "is_sharing": False},
        {"type": "quad", "multiplier": 1.2, "is_sharing": False},
        {"type": "quint", "multiplier": 1.1, "is_sharing": False},
        {"type": "6-bed", "multiplier": 1.05, "is_sharing": False},
        {"type": "7-bed", "multiplier": 1.0, "is_sharing": False},
        {"type": "8-bed", "multiplier": 0.95, "is_sharing": False},
        {"type": "9-bed", "multiplier": 0.92, "is_sharing": False},
        {"type": "10-bed", "multiplier": 0.9, "is_sharing": False},
    ]
    
    # Price date ranges
    price_periods = [
        {"start": "2026-01-01", "end": "2026-03-31", "season": "Winter"},
        {"start": "2026-04-01", "end": "2026-06-30", "season": "Spring"},
        {"start": "2026-07-01", "end": "2026-09-30", "season": "Summer"},
        {"start": "2026-10-01", "end": "2026-12-31", "season": "Fall"},
    ]
    
    hotel_count = 0
    price_count = 0
    
    for hotel_data in hotels_data:
        city = cities.get(hotel_data["city_code"])
        if not city:
            print(f"❌ City {hotel_data['city_code']} not found, skipping hotel")
            continue
        
        # Create hotel
        hotel = Hotels.objects.create(
            organization=org,
            owner_organization_id=org.id,
            name=hotel_data["name"],
            city=city,
            address=hotel_data["address"],
            google_location=hotel_data["google_location"],
            contact_number=hotel_data["contact"][0]["number"],
            category=hotel_data["category"],
            distance=hotel_data["distance"],
            walking_distance=hotel_data["walking_distance"],
            walking_time=hotel_data["walking_time"],
            is_active=True,
            status='active',
        )
        
        print(f"  ✅ Created hotel: {hotel.name}")
        hotel_count += 1
        
        # Add contact details
        for contact in hotel_data["contact"]:
            HotelContactDetails.objects.create(
                hotel=hotel,
                contact_person=contact["person"],
                contact_number=contact["number"]
            )
        
        # Add pricing for all room types and all periods
        base_min, base_max = hotel_data["base_price_range"]
        
        for period in price_periods:
            # Add seasonal variation (±10%)
            seasonal_factor = 1.0 + random.uniform(-0.1, 0.1)
            
            for room_type in room_types:
                # Calculate base price for this room type
                base_price = random.uniform(base_min, base_max) * room_type["multiplier"] * seasonal_factor
                
                # Purchase price is typically 70-80% of selling price
                purchase_price = base_price * random.uniform(0.70, 0.80)
                
                HotelPrices.objects.create(
                    hotel=hotel,
                    start_date=period["start"],
                    end_date=period["end"],
                    room_type=room_type["type"],
                    price=round(base_price, 2),  # Selling price
                    purchase_price=round(purchase_price, 2),  # Purchase price
                    is_sharing_allowed=room_type["is_sharing"]
                )
                price_count += 1
    
    print(f"\n✅ Hotel creation completed!")
    print(f"  - Hotels created: {hotel_count}")
    print(f"  - Price entries created: {price_count}")
    print(f"  - Contact details: {HotelContactDetails.objects.filter(hotel__organization=org).count()}")
    
    return hotel_count, price_count

def main():
    """Main function to set up complete hotel system"""
    print("🚀 SAER Hotel System Setup")
    print("=" * 50)
    
    # Step 1: Get organization
    print("\n📋 Step 1: Getting organization...")
    org = get_saer_organization()
    
    # Step 2: Clear existing hotels
    print("\n📋 Step 2: Clearing existing hotels...")
    clear_existing_hotels()
    
    # Step 3: Set up cities
    print("\n📋 Step 3: Setting up cities...")
    cities = create_cities(org)
    
    # Step 4: Set up hotel categories
    print("\n📋 Step 4: Setting up hotel categories...")
    categories = create_hotel_categories(org)
    
    # Step 5: Set up bed types
    print("\n📋 Step 5: Setting up bed types...")
    bed_types = create_bed_types(org)
    
    # Step 6: Create hotels with comprehensive pricing
    print("\n📋 Step 6: Creating hotels with comprehensive pricing...")
    hotel_count, price_count = create_hotels_with_comprehensive_pricing(org, cities, categories)
    
    # Final summary
    print("\n" + "=" * 50)
    print("🎉 SETUP COMPLETED SUCCESSFULLY!")
    print("=" * 50)
    print(f"✅ Organization: {org.name} ({org.org_code})")
    print(f"✅ Cities: {len(cities)} created/found")
    print(f"✅ Categories: {len(categories)} created/found")
    print(f"✅ Bed Types: {len(bed_types)} created/found")
    print(f"✅ Hotels: {hotel_count} created")
    print(f"✅ Price Entries: {price_count} created")
    print("\n🏨 Hotels include:")
    print("   - Burj Al Arab Dubai (Luxury)")
    print("   - Swissotel Makkah (5 Star)")
    print("   - Hilton Makkah Convention Hotel (5 Star)")
    print("   - Pullman ZamZam Makkah (4 Star)")
    print("   - Madinah Hilton Hotel (5 Star)")
    print("   - Sheraton Madinah Hotel (4 Star)")
    print("   - Taiba Madinah Hotel (3 Star)")
    print("   - Grand Hyatt Dubai (5 Star)")
    print("   - Jeddah Intercontinental (5 Star)")
    print("   - Riyadh Marriott Hotel (4 Star)")
    print("\n💰 Room Types Available:")
    print("   - Single, Sharing, Double, Triple, Quad, Quint")
    print("   - 6-bed, 7-bed, 8-bed, 9-bed, 10-bed")
    print("\n📅 Price Periods:")
    print("   - Winter: Jan-Mar 2026")
    print("   - Spring: Apr-Jun 2026")
    print("   - Summer: Jul-Sep 2026")
    print("   - Fall: Oct-Dec 2026")
    print("\n💼 All prices include both Purchase & Selling prices")
    print("💡 Sharing rooms are marked as sharing-allowed")
    print("\nReady for bookings! 🎯")

if __name__ == "__main__":
    main()