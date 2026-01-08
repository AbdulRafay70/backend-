"""
Script to populate the database with sample data for Visa and Others page.
This will add multiple entries for:
- Riyal Rates
- Shirkas (Travel Companies)
- Cities
- Airlines/Flights
- Visas
- Transport
- Food
- Ziyarat

Usage: python populate_visa_data.py
"""

import os
import django
import sys
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import (
    RiyalRate, Shirka, City, Airlines, Visa,
    TransportSectorPrice, FoodPrice, ZiaratPrice,
    OnlyVisaPrice
)
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

def create_riyal_rate(org):
    """Create or update Riyal Rate"""
    print("\n📊 Creating/Updating Riyal Rate...")
    riyal_rate, created = RiyalRate.objects.update_or_create(
        organization=org,
        defaults={
            'rate': 74.50,
            'is_visa_pkr': True,
            'is_hotel_pkr': False,
            'is_transport_pkr': True,
            'is_ziarat_pkr': False,
            'is_food_pkr': True,
        }
    )
    action = "Created" if created else "Updated"
    print(f"   ✅ {action} Riyal Rate: 1 SAR = {riyal_rate.rate} PKR")

def create_shirkas(org):
    """Create multiple Shirka (Travel Companies)"""
    print("\n🏢 Creating Shirkas (Travel Companies)...")
    shirka_names = [
        "Al-Safa Tours & Travels",
        "Makkah Express",
        "Madina Travel Services",
        "Hajj & Umrah International",
        "Royal Saudi Tours",
        "Green Dome Travel",
        "Kaaba Tours",
        "Prophet's Journey",
        "Al-Taif Travel Agency",
        "Badr Tours Pakistan"
    ]
    
    count = 0
    for name in shirka_names:
        shirka, created = Shirka.objects.get_or_create(
            organization=org,
            name=name
        )
        if created:
            count += 1
            print(f"   ✅ Created: {name}")
    
    print(f"   📦 Total: {count} new Shirkas created")

def create_cities(org):
    """Create multiple Cities"""
    print("\n🏙️ Creating Cities...")
    cities_data = [
        {"name": "Makkah", "code": "MAK"},
        {"name": "Madinah", "code": "MED"},
        {"name": "Jeddah", "code": "JED"},
        {"name": "Riyadh", "code": "RUH"},
        {"name": "Dammam", "code": "DMM"},
        {"name": "Taif", "code": "TIF"},
        {"name": "Yanbu", "code": "YNB"},
        {"name": "Tabuk", "code": "TUU"},
        {"name": "Abha", "code": "AHB"},
        {"name": "Jizan", "code": "GIZ"},
    ]
    
    count = 0
    for city_data in cities_data:
        city, created = City.objects.get_or_create(
            organization=org,
            code=city_data["code"],
            defaults={'name': city_data["name"]}
        )
        if created:
            count += 1
            print(f"   ✅ Created: {city_data['name']} ({city_data['code']})")
    
    print(f"   📦 Total: {count} new Cities created")

def create_airlines(org):
    """Create multiple Airlines"""
    print("\n✈️ Creating Airlines...")
    airlines_data = [
        {"name": "Saudi Arabian Airlines", "code": "SV"},
        {"name": "Pakistan International Airlines", "code": "PK"},
        {"name": "Emirates", "code": "EK"},
        {"name": "Qatar Airways", "code": "QR"},
        {"name": "Etihad Airways", "code": "EY"},
        {"name": "Flynas", "code": "XY"},
        {"name": "Flyadeal", "code": "F3"},
        {"name": "Air Arabia", "code": "G9"},
        {"name": "Gulf Air", "code": "GF"},
        {"name": "Airblue", "code": "PA"},
    ]
    
    count = 0
    for airline_data in airlines_data:
        airline, created = Airlines.objects.get_or_create(
            organization=org,
            code=airline_data["code"],
            defaults={
                'name': airline_data["name"],
                'is_umrah_seat': True
            }
        )
        if created:
            count += 1
            print(f"   ✅ Created: {airline_data['name']} ({airline_data['code']})")
    
    print(f"   📦 Total: {count} new Airlines created")

def create_visas(org):
    """Create multiple Visa records"""
    print("\n🛂 Creating Visas...")
    visa_types = ['umrah', 'tourist', 'business']
    count = 0
    
    for visa_type in visa_types:
        # Create 3 visas for each type
        for i in range(1, 4):
            issue_date = datetime.now().date()
            expiry_date = issue_date + timedelta(days=30 if visa_type == 'umrah' else 90)
            
            visa = Visa.objects.create(
                organization=org,
                visa_type=visa_type,
                country='SAU',
                issue_date=issue_date,
                expiry_date=expiry_date,
                status='issued',
                adult_price=Decimal(4500 + (i * 500)),
                child_price=Decimal(3500 + (i * 400)),
                infant_price=Decimal(2500 + (i * 300)),
                validity_days=30 if visa_type == 'umrah' else 90,
                service_provider=f"Visa Service Provider {i}",
                notes=f"Sample {visa_type} visa entry #{i}"
            )
            count += 1
            print(f"   ✅ Created: {visa.visa_id} - {visa.get_visa_type_display()}")
    
    print(f"   📦 Total: {count} new Visas created")

def create_transport(org):
    """Create multiple Transport Sector Prices"""
    print("\n🚌 Creating Transport Sectors...")
    
    transport_data = [
        {"name": "Makkah to Madinah - Standard Bus", "reference": "type1", "adult": 1500, "child": 1000, "infant": 500},
        {"name": "Makkah to Madinah - Luxury Bus", "reference": "type1", "adult": 2500, "child": 1800, "infant": 800},
        {"name": "Jeddah to Makkah - Van", "reference": "type1", "adult": 800, "child": 600, "infant": 300},
        {"name": "Jeddah to Makkah - Coaster", "reference": "type1", "adult": 1200, "child": 900, "infant": 400},
        {"name": "Madinah to Jeddah - Bus", "reference": "type2", "adult": 2000, "child": 1500, "infant": 700},
        {"name": "Airport Transfer - Sedan", "reference": "type1", "adult": 500, "child": 400, "infant": 200},
        {"name": "Makkah Local - Hiace", "reference": "type1", "adult": 600, "child": 450, "infant": 250},
        {"name": "Madinah Local - SUV", "reference": "type2", "adult": 700, "child": 500, "infant": 300},
    ]
    
    count = 0
    for transport in transport_data:
        obj = TransportSectorPrice.objects.create(
            organization=org,
            reference=transport["reference"],
            name=transport["name"],
            adult_selling_price=transport["adult"],
            adult_purchase_price=transport["adult"] * 0.8,  # 20% margin
            child_selling_price=transport["child"],
            child_purchase_price=transport["child"] * 0.8,
            infant_selling_price=transport["infant"],
            infant_purchase_price=transport["infant"] * 0.8,
        )
        count += 1
        print(f"   ✅ Created: {obj.name}")
    
    print(f"   📦 Total: {count} new Transport Sectors created")

def create_food_prices(org):
    """Create multiple Food Prices"""
    print("\n🍽️ Creating Food Prices...")
    
    # Get cities for reference
    makkah = City.objects.filter(organization=org, code="MAK").first()
    madinah = City.objects.filter(organization=org, code="MED").first()
    
    food_data = [
        {"title": "Standard Buffet Package", "city": makkah, "min_pex": 1, "per_pex": 500, "price": 500},
        {"title": "Premium Buffet Package", "city": makkah, "min_pex": 1, "per_pex": 800, "price": 800},
        {"title": "Deluxe Buffet Package", "city": makkah, "min_pex": 1, "per_pex": 1200, "price": 1200},
        {"title": "Standard Buffet Package", "city": madinah, "min_pex": 1, "per_pex": 450, "price": 450},
        {"title": "Premium Buffet Package", "city": madinah, "min_pex": 1, "per_pex": 750, "price": 750},
        {"title": "Economy Meal Plan", "city": makkah, "min_pex": 1, "per_pex": 350, "price": 350},
        {"title": "Family Package - Makkah", "city": makkah, "min_pex": 4, "per_pex": 600, "price": 600},
        {"title": "Family Package - Madinah", "city": madinah, "min_pex": 4, "per_pex": 550, "price": 550},
    ]
    
    count = 0
    for food in food_data:
        if food["city"]:  # Only create if city exists
            obj = FoodPrice.objects.create(
                organization=org,
                city=food["city"],
                title=food["title"],
                min_pex=food["min_pex"],
                per_pex=food["per_pex"],
                price=food["price"],
                purchase_price=food["price"] * 0.75,  # 25% margin
                active=True,
                description=f"Food package for {food['city'].name}"
            )
            count += 1
            print(f"   ✅ Created: {obj.title} - {obj.city.name}")
    
    print(f"   📦 Total: {count} new Food Prices created")

def create_ziyarat_prices(org):
    """Create multiple Ziyarat Prices"""
    print("\n🕌 Creating Ziyarat Prices...")
    
    # Get cities
    makkah = City.objects.filter(organization=org, code="MAK").first()
    madinah = City.objects.filter(organization=org, code="MED").first()
    
    ziyarat_data = [
        {"title": "Makkah Ziyarat - Full Day", "city": makkah, "price": 2000, "min_pex": 1, "max_pex": 50, "contact": "Ahmed Ali", "phone": "+966501234567"},
        {"title": "Makkah Ziyarat - Half Day", "city": makkah, "price": 1200, "min_pex": 1, "max_pex": 50, "contact": "Mohammed Hassan", "phone": "+966501234568"},
        {"title": "Historical Makkah Tour", "city": makkah, "price": 1500, "min_pex": 5, "max_pex": 40, "contact": "Abdullah Khan", "phone": "+966501234569"},
        {"title": "Madinah Ziyarat - Full Day", "city": madinah, "price": 1800, "min_pex": 1, "max_pex": 50, "contact": "Bilal Ahmed", "phone": "+966501234570"},
        {"title": "Madinah Ziyarat - Half Day", "city": madinah, "price": 1000, "min_pex": 1, "max_pex": 50, "contact": "Usman Ali", "phone": "+966501234571"},
        {"title": "Uhud Mountain Visit", "city": madinah, "price": 800, "min_pex": 5, "max_pex": 45, "contact": "Hamza Sheikh", "phone": "+966501234572"},
        {"title": "Quba Mosque Tour", "city": madinah, "price": 600, "min_pex": 5, "max_pex": 40, "contact": "Talha Rashid", "phone": "+966501234573"},
        {"title": "Cave of Hira Tour", "city": makkah, "price": 1000, "min_pex": 3, "max_pex": 30, "contact": "Zubair Ahmad", "phone": "+966501234574"},
    ]
    
    count = 0
    for ziyarat in ziyarat_data:
        if ziyarat["city"]:  # Only create if city exists
            obj = ZiaratPrice.objects.create(
                organization=org,
                city=ziyarat["city"],
                ziarat_title=ziyarat["title"],
                price=ziyarat["price"],
                purchase_price=ziyarat["price"] * 0.7,  # 30% margin
                min_pex=ziyarat["min_pex"],
                max_pex=ziyarat["max_pex"],
                contact_person=ziyarat["contact"],
                contact_number=ziyarat["phone"],
                status="active",
                description=f"Ziyarat tour in {ziyarat['city'].name}"
            )
            count += 1
            print(f"   ✅ Created: {obj.ziarat_title} - {obj.city.name}")
    
    print(f"   📦 Total: {count} new Ziyarat Prices created")

def create_only_visa_prices(org):
    """Create Only Visa Prices (separate visa options)"""
    print("\n🛂 Creating Only Visa Prices...")
    
    # Get cities
    makkah = City.objects.filter(organization=org, code="MAK").first()
    jeddah = City.objects.filter(organization=org, code="JED").first()
    
    visa_prices_data = [
        {"title": "28 Days Umrah Visa - Jeddah", "city": jeddah, "type": "28_days", "min_days": "1", "max_days": "28",
         "adult": 4500, "child": 3500, "infant": 2500, "option": "only"},
        {"title": "28 Days Umrah Visa - Makkah", "city": makkah, "type": "28_days", "min_days": "1", "max_days": "28",
         "adult": 4500, "child": 3500, "infant": 2500, "option": "only"},
        {"title": "90 Days Long Stay Visa", "city": jeddah, "type": "long_stay", "min_days": "1", "max_days": "90",
         "adult": 8500, "child": 6500, "infant": 4500, "option": "long_term"},
        {"title": "15 Days Express Visa", "city": jeddah, "type": "express", "min_days": "1", "max_days": "15",
         "adult": 3500, "child": 2800, "infant": 2000, "option": "only"},
    ]
    
    count = 0
    for visa_price in visa_prices_data:
        if visa_price["city"]:
            obj = OnlyVisaPrice.objects.create(
                organization=org,
                city=visa_price["city"],
                title=visa_price["title"],
                type=visa_price["type"],
                min_days=visa_price["min_days"],
                max_days=visa_price["max_days"],
                adult_selling_price=visa_price["adult"],
                adult_purchase_price=visa_price["adult"] * 0.85,  # 15% margin
                child_selling_price=visa_price["child"],
                child_purchase_price=visa_price["child"] * 0.85,
                infant_selling_price=visa_price["infant"],
                infant_purchase_price=visa_price["infant"] * 0.85,
                visa_option=visa_price["option"],
                status="active"
            )
            count += 1
            print(f"   ✅ Created: {obj.title}")
    
    print(f"   📦 Total: {count} new Only Visa Prices created")

def main():
    """Main function to populate all data"""
    print("=" * 70)
    print("🚀 Starting Database Population for Visa and Others Page")
    print("=" * 70)
    
    try:
        # Get organization
        org = get_organization()
        
        # Create all data
        create_riyal_rate(org)
        create_shirkas(org)
        create_cities(org)
        create_airlines(org)
        create_visas(org)
        create_transport(org)
        create_food_prices(org)
        create_ziyarat_prices(org)
        create_only_visa_prices(org)
        
        print("\n" + "=" * 70)
        print("✅ Database population completed successfully!")
        print("=" * 70)
        print("\n📊 Summary:")
        print(f"   - Riyal Rate: 1 record")
        print(f"   - Shirkas: {Shirka.objects.filter(organization=org).count()} records")
        print(f"   - Cities: {City.objects.filter(organization=org).count()} records")
        print(f"   - Airlines: {Airlines.objects.filter(organization=org).count()} records")
        print(f"   - Visas: {Visa.objects.filter(organization=org).count()} records")
        print(f"   - Transport: {TransportSectorPrice.objects.filter(organization=org).count()} records")
        print(f"   - Food Prices: {FoodPrice.objects.filter(organization=org).count()} records")
        print(f"   - Ziyarat Prices: {ZiaratPrice.objects.filter(organization=org).count()} records")
        print(f"   - Only Visa Prices: {OnlyVisaPrice.objects.filter(organization=org).count()} records")
        print("\n✨ You can now view this data in the Visa and Others page!")
        
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
