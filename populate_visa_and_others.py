"""
Populate Visa and Other Data
Includes: Visa Types, Visa Pricing, Food, Ziyarat, Transport Sectors, Airlines
"""

import os
import django
import sys
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import (
    Visa, SetVisaType, OnlyVisaPrice, TransportSectorPrice,
    Airlines, City, Shirka, RiyalRate
)
from organization.models import Organization

print("="*80)
print("VISA AND OTHER DATA POPULATION")
print("="*80)
print()

# Get organization ORG-0001 (saer.pk)
try:
    org = Organization.objects.get(org_code="ORG-0001")
    print(f"[OK] Using organization: {org.name} (Code: {org.org_code}, ID: {org.id})")
except Organization.DoesNotExist:
    print("[ERROR] Organization ORG-0001 (saer.pk) not found.")
    sys.exit(1)
except Exception as e:
    print(f"[ERROR] Error: {e}")
    sys.exit(1)

print()
print("-"*80)
print("STEP 1: RIYAL EXCHANGE RATE")
print("-"*80)

# Set Riyal exchange rate
riyal_rate, created = RiyalRate.objects.get_or_create(
    organization=org,
    defaults={
        "rate": 74.50,  # 1 SAR = 74.50 PKR
        "is_visa_pkr": True,
        "is_hotel_pkr": False,
        "is_transport_pkr": True,
        "is_ziarat_pkr": True,
        "is_food_pkr": True,
    }
)
print(f"  {'Created' if created else 'Updated'}: Riyal Rate = {riyal_rate.rate} PKR")

print()
print("-"*80)
print("STEP 2: VISA TYPES")
print("-"*80)

# Visa types
visa_types_data = [
    "Umrah Visa",
    "Visit Visa",
    "Tourist Visa",
]

for visa_type_name in visa_types_data:
    visa_type, created = SetVisaType.objects.get_or_create(
        organization=org,
        name=visa_type_name
    )
    print(f"  {'Created' if created else 'Exists'}: {visa_type.name}")

print()
print("-"*80)
print("STEP 3: VISA PRICING (OnlyVisaPrice)")
print("-"*80)

# Visa pricing with selling and purchasing prices
visa_prices_data = [
    {
        "type": "Normal",
        "adult_selling": 8000,
        "adult_purchase": 6000,
        "child_selling": 6000,
        "child_purchase": 4500,
        "infant_selling": 4000,
        "infant_purchase": 3000,
    },
    {
        "type": "Urgent",
        "adult_selling": 12000,
        "adult_purchase": 9000,
        "child_selling": 9000,
        "child_purchase": 6750,
        "infant_selling": 6000,
        "infant_purchase": 4500,
    },
    {
        "type": "Super Urgent",
        "adult_selling": 15000,
        "adult_purchase": 11000,
        "child_selling": 11000,
        "child_purchase": 8250,
        "infant_selling": 7500,
        "infant_purchase": 5625,
    },
]

for visa_data in visa_prices_data:
    visa_price, created = OnlyVisaPrice.objects.update_or_create(
        organization=org,
        type=visa_data["type"],
        defaults={
            "visa_option": "only",
            "min_days": "0",
            "max_days": "30",
            "adault_price": visa_data["adult_selling"],  # Note: typo in model field name
            "adult_purchase_price": visa_data["adult_purchase"],
            "child_price": visa_data["child_selling"],
            "child_purchase_price": visa_data["child_purchase"],
            "infant_price": visa_data["infant_selling"],
            "infant_purchase_price": visa_data["infant_purchase"],
        }
    )
    print(f"  {'Created' if created else 'Updated'}: {visa_data['type']}")
    print(f"    Adult: Sell={visa_data['adult_selling']}, Buy={visa_data['adult_purchase']}")
    print(f"    Child: Sell={visa_data['child_selling']}, Buy={visa_data['child_purchase']}")
    print(f"    Infant: Sell={visa_data['infant_selling']}, Buy={visa_data['infant_purchase']}")

print()
print("-"*80)
print("STEP 4: FOOD PRICING")
print("-"*80)

# Food pricing (stored in OnlyVisaPrice with title indicating food type)
food_prices_data = [
    {
        "title": "Breakfast",
        "type": "Food",
        "adult_selling": 500,
        "adult_purchase": 350,
        "child_selling": 350,
        "child_purchase": 250,
        "infant_selling": 200,
        "infant_purchase": 150,
    },
    {
        "title": "Lunch",
        "type": "Food",
        "adult_selling": 800,
        "adult_purchase": 600,
        "child_selling": 600,
        "child_purchase": 450,
        "infant_selling": 400,
        "infant_purchase": 300,
    },
    {
        "title": "Dinner",
        "type": "Food",
        "adult_selling": 800,
        "adult_purchase": 600,
        "child_selling": 600,
        "child_purchase": 450,
        "infant_selling": 400,
        "infant_purchase": 300,
    },
    {
        "title": "Full Board (3 Meals)",
        "type": "Food",
        "adult_selling": 2000,
        "adult_purchase": 1500,
        "child_selling": 1500,
        "child_purchase": 1125,
        "infant_selling": 1000,
        "infant_purchase": 750,
    },
]

for food_data in food_prices_data:
    food_price, created = OnlyVisaPrice.objects.update_or_create(
        organization=org,
        title=food_data["title"],
        type=food_data["type"],
        defaults={
            "visa_option": "only",
            "min_days": "0",
            "max_days": "0",
            "adault_price": food_data["adult_selling"],
            "adult_purchase_price": food_data["adult_purchase"],
            "child_price": food_data["child_selling"],
            "child_purchase_price": food_data["child_purchase"],
            "infant_price": food_data["infant_selling"],
            "infant_purchase_price": food_data["infant_purchase"],
        }
    )
    print(f"  {'Created' if created else 'Updated'}: {food_data['title']}")
    print(f"    Adult: Sell={food_data['adult_selling']}, Buy={food_data['adult_purchase']}")

print()
print("-"*80)
print("STEP 5: ZIYARAT PRICING")
print("-"*80)

# Ziyarat pricing (stored in OnlyVisaPrice with title indicating ziyarat type)
ziyarat_prices_data = [
    {
        "title": "Makkah Ziyarat",
        "type": "Ziyarat",
        "adult_selling": 3000,
        "adult_purchase": 2200,
        "child_selling": 2200,
        "child_purchase": 1650,
        "infant_selling": 1500,
        "infant_purchase": 1125,
    },
    {
        "title": "Madinah Ziyarat",
        "type": "Ziyarat",
        "adult_selling": 2500,
        "adult_purchase": 1800,
        "child_selling": 1800,
        "child_purchase": 1350,
        "infant_selling": 1200,
        "infant_purchase": 900,
    },
    {
        "title": "Combined Ziyarat (Makkah + Madinah)",
        "type": "Ziyarat",
        "adult_selling": 5000,
        "adult_purchase": 3800,
        "child_selling": 3800,
        "child_purchase": 2850,
        "infant_selling": 2500,
        "infant_purchase": 1875,
    },
]

for ziyarat_data in ziyarat_prices_data:
    ziyarat_price, created = OnlyVisaPrice.objects.update_or_create(
        organization=org,
        title=ziyarat_data["title"],
        type=ziyarat_data["type"],
        defaults={
            "visa_option": "only",
            "min_days": "0",
            "max_days": "0",
            "adault_price": ziyarat_data["adult_selling"],
            "adult_purchase_price": ziyarat_data["adult_purchase"],
            "child_price": ziyarat_data["child_selling"],
            "child_purchase_price": ziyarat_data["child_purchase"],
            "infant_price": ziyarat_data["infant_selling"],
            "infant_purchase_price": ziyarat_data["infant_purchase"],
        }
    )
    print(f"  {'Created' if created else 'Updated'}: {ziyarat_data['title']}")
    print(f"    Adult: Sell={ziyarat_data['adult_selling']}, Buy={ziyarat_data['adult_purchase']}")

print()
print("-"*80)
print("STEP 6: TRANSPORT SECTORS")
print("-"*80)

# Get cities for transport sectors
try:
    makkah = City.objects.get(name="Makkah", organization=org)
    madinah = City.objects.get(name="Madinah", organization=org)
    jeddah, _ = City.objects.get_or_create(
        name="Jeddah",
        defaults={"code": "JED", "organization": org}
    )
except City.DoesNotExist:
    print("[ERROR] Cities not found. Please run hotel population script first.")
    sys.exit(1)

# Transport sector pricing
transport_sectors_data = [
    # Small Sectors (within cities)
    {
        "from_city": makkah,
        "to_city": makkah,
        "sector_name": "Makkah Local",
        "adult_selling": 500,
        "adult_purchase": 350,
        "child_selling": 350,
        "child_purchase": 250,
        "infant_selling": 200,
        "infant_purchase": 150,
    },
    {
        "from_city": madinah,
        "to_city": madinah,
        "sector_name": "Madinah Local",
        "adult_selling": 500,
        "adult_purchase": 350,
        "child_selling": 350,
        "child_purchase": 250,
        "infant_selling": 200,
        "infant_purchase": 150,
    },
    {
        "from_city": jeddah,
        "to_city": jeddah,
        "sector_name": "Jeddah Local",
        "adult_selling": 600,
        "adult_purchase": 400,
        "child_selling": 400,
        "child_purchase": 300,
        "infant_selling": 250,
        "infant_purchase": 200,
    },
    # Big Sectors (between cities)
    {
        "from_city": jeddah,
        "to_city": makkah,
        "sector_name": "Jeddah to Makkah",
        "adult_selling": 2500,
        "adult_purchase": 1800,
        "child_selling": 1800,
        "child_purchase": 1350,
        "infant_selling": 1200,
        "infant_purchase": 900,
    },
    {
        "from_city": makkah,
        "to_city": madinah,
        "sector_name": "Makkah to Madinah",
        "adult_selling": 4000,
        "adult_purchase": 3000,
        "child_selling": 3000,
        "child_purchase": 2250,
        "infant_selling": 2000,
        "infant_purchase": 1500,
    },
    {
        "from_city": madinah,
        "to_city": jeddah,
        "sector_name": "Madinah to Jeddah",
        "adult_selling": 4500,
        "adult_purchase": 3300,
        "child_selling": 3300,
        "child_purchase": 2475,
        "infant_selling": 2200,
        "infant_purchase": 1650,
    },
]

for sector_data in transport_sectors_data:
    sector, created = TransportSectorPrice.objects.update_or_create(
        organization=org,
        from_city=sector_data["from_city"],
        to_city=sector_data["to_city"],
        defaults={
            "sector_name": sector_data["sector_name"],
            "adult_selling_price": sector_data["adult_selling"],
            "adult_purchase_price": sector_data["adult_purchase"],
            "child_selling_price": sector_data["child_selling"],
            "child_purchase_price": sector_data["child_purchase"],
            "infant_selling_price": sector_data["infant_selling"],
            "infant_purchase_price": sector_data["infant_purchase"],
        }
    )
    print(f"  {'Created' if created else 'Updated'}: {sector_data['sector_name']}")
    print(f"    {sector_data['from_city'].name} -> {sector_data['to_city'].name}")
    print(f"    Adult: Sell={sector_data['adult_selling']}, Buy={sector_data['adult_purchase']}")

print()
print("-"*80)
print("STEP 7: AIRLINES (SHIRKA)")
print("-"*80)

# Airlines data
airlines_data = [
    {"name": "Saudi Airlines", "code": "SV"},
    {"name": "PIA", "code": "PK"},
    {"name": "Emirates", "code": "EK"},
    {"name": "Etihad", "code": "EY"},
    {"name": "Flynas", "code": "XY"},
    {"name": "Air Arabia", "code": "G9"},
]

for airline_data in airlines_data:
    airline, created = Airlines.objects.get_or_create(
        organization=org,
        name=airline_data["name"],
        defaults={"code": airline_data["code"], "is_umrah_seat": True}
    )
    print(f"  {'Created' if created else 'Exists'}: {airline.name} ({airline.code})")

# Also create Shirka entries (if different from Airlines)
for airline_data in airlines_data:
    shirka, created = Shirka.objects.get_or_create(
        organization=org,
        name=airline_data["name"]
    )
    if created:
        print(f"  Created Shirka: {shirka.name}")

print()
print("="*80)
print("[OK] VISA AND OTHER DATA POPULATION COMPLETE!")
print("="*80)
print()
print("Summary:")
print(f"  - Riyal Rate: {RiyalRate.objects.filter(organization=org).count()}")
print(f"  - Visa Types: {SetVisaType.objects.filter(organization=org).count()}")
print(f"  - Visa Prices: {OnlyVisaPrice.objects.filter(organization=org, type__in=['Normal', 'Urgent', 'Super Urgent']).count()}")
print(f"  - Food Prices: {OnlyVisaPrice.objects.filter(organization=org, type='Food').count()}")
print(f"  - Ziyarat Prices: {OnlyVisaPrice.objects.filter(organization=org, type='Ziyarat').count()}")
print(f"  - Transport Sectors: {TransportSectorPrice.objects.filter(organization=org).count()}")
print(f"  - Airlines: {Airlines.objects.filter(organization=org).count()}")
print(f"  - Shirka: {Shirka.objects.filter(organization=org).count()}")
print()
