"""
Complete System Data Population Script
This script will populate:
1. Visa data and prices
2. Transport sector data (big and small sectors)
3. Food data
4. Flight/Ticket data
5. Ziyarat data

Usage: python populate_complete_system_data.py
"""

import os
import django
import sys
from datetime import datetime, timedelta, date
from decimal import Decimal
import random

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import (
    Visa, UmrahVisaPrice, UmrahVisaPriceTwo, OnlyVisaPrice, 
    TransportSectorPrice, Airlines, City, FoodPrice, ZiaratPrice
)
from booking.models import Sector, BigSector, VehicleType
from tickets.models import Ticket, TicketTripDetails
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

def get_or_create_cities(org):
    """Get existing cities or create them"""
    print("\n🏙️ Setting up cities...")
    
    cities_data = [
        {"name": "Karachi", "code": "KHI"},
        {"name": "Lahore", "code": "LHE"},
        {"name": "Islamabad", "code": "ISB"},
        {"name": "Multan", "code": "MUX"},
        {"name": "Faisalabad", "code": "LYP"},
        {"name": "Makkah", "code": "MAK"},
        {"name": "Madinah", "code": "MED"},
        {"name": "Jeddah", "code": "JED"},
        {"name": "Riyadh", "code": "RUH"},
        {"name": "Dubai", "code": "DXB"},
        {"name": "Abu Dhabi", "code": "AUH"},
        {"name": "Sharjah", "code": "SHJ"},
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

def create_visa_data(org, cities):
    """Create comprehensive visa data"""
    print("\n📋 Creating visa data...")
    
    # Create visa types
    visa_types = [
        {
            'visa_type': 'umrah',
            'country': 'SAU',
            'adult_price': 25000,
            'child_price': 20000,
            'infant_price': 15000,
            'service_provider': 'Saudi Consulate',
            'service_provider_contact': '+92-21-35251866',
            'validity_days': 90,
            'notes': 'Standard Umrah visa for Pakistani citizens'
        },
        {
            'visa_type': 'tourist',
            'country': 'SAU',
            'adult_price': 30000,
            'child_price': 25000,
            'infant_price': 18000,
            'service_provider': 'Saudi Tourism Authority',
            'service_provider_contact': '+92-21-35251867',
            'validity_days': 365,
            'notes': 'Saudi Arabia tourist visa - 1 year validity'
        },
        {
            'visa_type': 'umrah',
            'country': 'UAE',
            'adult_price': 15000,
            'child_price': 12000,
            'infant_price': 8000,
            'service_provider': 'UAE Consulate',
            'service_provider_contact': '+92-21-35251868',
            'validity_days': 60,
            'notes': 'UAE visit visa for transit/tourism'
        },
    ]
    
    visa_count = 0
    for visa_data in visa_types:
        visa = Visa.objects.create(
            organization=org,
            **visa_data
        )
        print(f"  ✅ Created visa: {visa.get_visa_type_display()} - {visa.get_country_display()}")
        visa_count += 1
    
    # Create Umrah visa prices (traditional structure)
    umrah_visa_prices = [
        {
            'visa_type': 'Standard Umrah',
            'category': 'Regular',
            'adault_price': 25000,
            'child_price': 20000,
            'infant_price': 15000,
            'maximum_nights': 30,
        },
        {
            'visa_type': 'Express Umrah',
            'category': 'Fast Track',
            'adault_price': 35000,
            'child_price': 28000,
            'infant_price': 20000,
            'maximum_nights': 45,
        },
        {
            'visa_type': 'Premium Umrah',
            'category': 'VIP',
            'adault_price': 50000,
            'child_price': 40000,
            'infant_price': 25000,
            'maximum_nights': 60,
        }
    ]
    
    umrah_visa_count = 0
    for visa_price in umrah_visa_prices:
        umrah_visa = UmrahVisaPrice.objects.create(
            organization=org,
            **visa_price
        )
        print(f"  ✅ Created Umrah visa price: {visa_price['visa_type']}")
        umrah_visa_count += 1
    
    # Create Only visa prices
    only_visa_prices = [
        {
            'title': 'Umrah Visa Only - 30 Days',
            'type': 'umrah',
            'min_days': '15',
            'max_days': '30',
            'city': cities['MAK'],
            'adult_selling_price': 28000,
            'adult_purchase_price': 22000,
            'child_selling_price': 22000,
            'child_purchase_price': 18000,
            'infant_selling_price': 16000,
            'infant_purchase_price': 12000,
            'status': 'active',
            'visa_option': 'only'
        },
        {
            'title': 'Umrah Visa with Transport',
            'type': 'umrah_transport',
            'min_days': '20',
            'max_days': '45',
            'city': cities['MAK'],
            'adult_selling_price': 45000,
            'adult_purchase_price': 35000,
            'child_selling_price': 35000,
            'child_purchase_price': 28000,
            'infant_selling_price': 25000,
            'infant_purchase_price': 20000,
            'is_transport': True,
            'status': 'active',
            'visa_option': 'only'
        },
        {
            'title': 'Long Term Umrah Visa',
            'type': 'long_term',
            'min_days': '60',
            'max_days': '90',
            'city': cities['MAK'],
            'adult_selling_price': 55000,
            'adult_purchase_price': 45000,
            'child_selling_price': 45000,
            'child_purchase_price': 35000,
            'infant_selling_price': 35000,
            'infant_purchase_price': 25000,
            'validity_days': 90,
            'multi_entry': True,
            'status': 'active',
            'visa_option': 'long_term'
        }
    ]
    
    only_visa_count = 0
    for only_visa in only_visa_prices:
        visa = OnlyVisaPrice.objects.create(
            organization=org,
            **only_visa
        )
        print(f"  ✅ Created only visa price: {only_visa['title']}")
        only_visa_count += 1
    
    return visa_count + umrah_visa_count + only_visa_count

def create_transport_sectors(org, cities):
    """Create transport sectors (small and big sectors)"""
    print("\n🚌 Creating transport sectors...")
    
    # Create small sectors
    small_sectors_data = [
        {
            'departure_city': cities['KHI'],
            'arrival_city': cities['JED'],
            'contact_name': 'Karachi Airport Transport',
            'contact_number': '+92-21-99201234',
            'sector_type': 'AIRPORT PICKUP',
            'is_airport_pickup': True,
        },
        {
            'departure_city': cities['JED'],
            'arrival_city': cities['MAK'],
            'contact_name': 'Jeddah to Makkah Transport',
            'contact_number': '+966-12-123-4567',
            'sector_type': 'HOTEL TO HOTEL',
            'is_hotel_to_hotel': True,
        },
        {
            'departure_city': cities['MAK'],
            'arrival_city': cities['MED'],
            'contact_name': 'Makkah to Madinah Transport',
            'contact_number': '+966-12-234-5678',
            'sector_type': 'HOTEL TO HOTEL',
            'is_hotel_to_hotel': True,
        },
        {
            'departure_city': cities['MED'],
            'arrival_city': cities['JED'],
            'contact_name': 'Madinah to Jeddah Airport',
            'contact_number': '+966-12-345-6789',
            'sector_type': 'AIRPORT DROP',
            'is_airport_drop': True,
        },
        {
            'departure_city': cities['LHE'],
            'arrival_city': cities['JED'],
            'contact_name': 'Lahore Airport Transport',
            'contact_number': '+92-42-99201234',
            'sector_type': 'AIRPORT PICKUP',
            'is_airport_pickup': True,
        },
        {
            'departure_city': cities['ISB'],
            'arrival_city': cities['DXB'],
            'contact_name': 'Islamabad to Dubai Transport',
            'contact_number': '+92-51-99201234',
            'sector_type': 'AIRPORT PICKUP',
            'is_airport_pickup': True,
        },
        {
            'departure_city': cities['DXB'],
            'arrival_city': cities['MAK'],
            'contact_name': 'Dubai to Makkah Transport',
            'contact_number': '+971-4-123-4567',
            'sector_type': 'HOTEL TO HOTEL',
            'is_hotel_to_hotel': True,
        },
    ]
    
    small_sectors = []
    small_sector_count = 0
    for sector_data in small_sectors_data:
        sector = Sector.objects.create(
            organization=org,
            **sector_data
        )
        small_sectors.append(sector)
        print(f"  ✅ Created small sector: {sector}")
        small_sector_count += 1
    
    # Create big sectors (collections of small sectors)
    big_sectors_data = [
        {
            'name': 'Pakistan to Makkah Full Route',
            'small_sectors': [0, 1],  # Indices from small_sectors list
        },
        {
            'name': 'Makkah to Madinah Round Trip',
            'small_sectors': [1, 2],
        },
        {
            'name': 'Complete Umrah Transport Package',
            'small_sectors': [0, 1, 2, 3],
        },
        {
            'name': 'UAE Route Package',
            'small_sectors': [5, 6],
        }
    ]
    
    big_sector_count = 0
    for big_sector_data in big_sectors_data:
        big_sector = BigSector.objects.create(organization=org)
        
        # Add small sectors to the big sector
        sector_indices = big_sector_data['small_sectors']
        for idx in sector_indices:
            if idx < len(small_sectors):
                big_sector.small_sectors.add(small_sectors[idx])
        
        print(f"  ✅ Created big sector: {big_sector} with {len(sector_indices)} small sectors")
        big_sector_count += 1
    
    return small_sector_count, big_sector_count

def create_transport_sector_prices(org):
    """Create transport sector prices"""
    print("\n💰 Creating transport sector prices...")
    
    transport_prices = [
        {
            'reference': 'airport_pickup_economy',
            'name': 'Airport Pickup - Economy',
            'vehicle_type': 1,
            'adult_selling_price': 15000,
            'adult_purchase_price': 12000,
            'child_selling_price': 10000,
            'child_purchase_price': 8000,
            'infant_selling_price': 5000,
            'infant_purchase_price': 3000,
            'is_visa': False,
            'only_transport_charge': True,
        },
        {
            'reference': 'airport_pickup_luxury',
            'name': 'Airport Pickup - Luxury',
            'vehicle_type': 2,
            'adult_selling_price': 25000,
            'adult_purchase_price': 20000,
            'child_selling_price': 18000,
            'child_purchase_price': 14000,
            'infant_selling_price': 10000,
            'infant_purchase_price': 7000,
            'is_visa': False,
            'only_transport_charge': True,
        },
        {
            'reference': 'makkah_madinah_standard',
            'name': 'Makkah to Madinah - Standard',
            'vehicle_type': 1,
            'adult_selling_price': 20000,
            'adult_purchase_price': 15000,
            'child_selling_price': 15000,
            'child_purchase_price': 12000,
            'infant_selling_price': 8000,
            'infant_purchase_price': 5000,
            'is_visa': False,
            'only_transport_charge': True,
        },
        {
            'reference': 'complete_transport_package',
            'name': 'Complete Transport Package',
            'vehicle_type': 3,
            'adult_selling_price': 75000,
            'adult_purchase_price': 60000,
            'child_selling_price': 55000,
            'child_purchase_price': 45000,
            'infant_selling_price': 30000,
            'infant_purchase_price': 20000,
            'is_visa': True,
            'only_transport_charge': False,
        },
        {
            'reference': 'ziyarat_transport',
            'name': 'Ziyarat Transport Service',
            'vehicle_type': 2,
            'adult_selling_price': 35000,
            'adult_purchase_price': 28000,
            'child_selling_price': 25000,
            'child_purchase_price': 20000,
            'infant_selling_price': 15000,
            'infant_purchase_price': 10000,
            'is_visa': False,
            'only_transport_charge': False,
        },
    ]
    
    transport_count = 0
    for transport_data in transport_prices:
        transport = TransportSectorPrice.objects.create(
            organization=org,
            **transport_data
        )
        print(f"  ✅ Created transport price: {transport.name}")
        transport_count += 1
    
    return transport_count

def create_vehicle_types(org, small_sectors, big_sectors):
    """Create vehicle types"""
    print("\n🚐 Creating vehicle types...")
    
    vehicle_types_data = [
        {
            'vehicle_name': 'Toyota Hiace',
            'vehicle_type': 'Mini Bus',
            'price': 15000,
            'adult_selling_price': 18000,
            'adult_purchase_price': 14000,
            'child_selling_price': 12000,
            'child_purchase_price': 10000,
            'infant_selling_price': 8000,
            'infant_purchase_price': 6000,
            'visa_type': 'umrah',
            'status': 'active',
            'organization': org,
            'small_sector': small_sectors[0] if small_sectors else None,
        },
        {
            'vehicle_name': 'Mercedes Sprinter',
            'vehicle_type': 'Luxury Van',
            'price': 25000,
            'adult_selling_price': 30000,
            'adult_purchase_price': 22000,
            'child_selling_price': 20000,
            'child_purchase_price': 16000,
            'infant_selling_price': 12000,
            'infant_purchase_price': 9000,
            'visa_type': 'umrah',
            'status': 'active',
            'organization': org,
            'small_sector': small_sectors[1] if len(small_sectors) > 1 else None,
        },
        {
            'vehicle_name': 'Coaster Bus',
            'vehicle_type': 'Bus',
            'price': 35000,
            'adult_selling_price': 40000,
            'adult_purchase_price': 30000,
            'child_selling_price': 28000,
            'child_purchase_price': 22000,
            'infant_selling_price': 18000,
            'infant_purchase_price': 14000,
            'visa_type': 'umrah',
            'status': 'active',
            'organization': org,
            'big_sector': big_sectors[0] if big_sectors else None,
        },
        {
            'vehicle_name': 'Luxury Coach',
            'vehicle_type': 'Premium Bus',
            'price': 50000,
            'adult_selling_price': 60000,
            'adult_purchase_price': 45000,
            'child_selling_price': 40000,
            'child_purchase_price': 32000,
            'infant_selling_price': 25000,
            'infant_purchase_price': 20000,
            'visa_type': 'umrah',
            'status': 'active',
            'organization': org,
            'big_sector': big_sectors[1] if len(big_sectors) > 1 else None,
        },
    ]
    
    vehicle_count = 0
    for vehicle_data in vehicle_types_data:
        vehicle = VehicleType.objects.create(**vehicle_data)
        print(f"  ✅ Created vehicle type: {vehicle.vehicle_name} - {vehicle.vehicle_type}")
        vehicle_count += 1
    
    return vehicle_count

def create_food_data(org, cities):
    """Create food data"""
    print("\n🍽️ Creating food data...")
    
    food_data = [
        {
            'city': cities['MAK'],
            'title': 'Standard Makkah Meals',
            'description': 'Basic Pakistani/Indian meals including breakfast, lunch, dinner',
            'min_pex': 10,
            'per_pex': 50,
            'price': 8000,
            'purchase_price': 6000,
            'adult_selling_price': 8500,
            'adult_purchase_price': 6500,
            'child_selling_price': 6000,
            'child_purchase_price': 4500,
            'infant_selling_price': 3000,
            'infant_purchase_price': 2000,
            'active': True,
        },
        {
            'city': cities['MAK'],
            'title': 'Premium Makkah Buffet',
            'description': 'Premium buffet with international cuisine options',
            'min_pex': 15,
            'per_pex': 100,
            'price': 15000,
            'purchase_price': 12000,
            'adult_selling_price': 16000,
            'adult_purchase_price': 13000,
            'child_selling_price': 12000,
            'child_purchase_price': 9500,
            'infant_selling_price': 6000,
            'infant_purchase_price': 4500,
            'active': True,
        },
        {
            'city': cities['MED'],
            'title': 'Standard Madinah Meals',
            'description': 'Traditional Pakistani meals in Madinah',
            'min_pex': 8,
            'per_pex': 40,
            'price': 7000,
            'purchase_price': 5500,
            'adult_selling_price': 7500,
            'adult_purchase_price': 6000,
            'child_selling_price': 5500,
            'child_purchase_price': 4200,
            'infant_selling_price': 2500,
            'infant_purchase_price': 1800,
            'active': True,
        },
        {
            'city': cities['MED'],
            'title': 'Deluxe Madinah Catering',
            'description': 'High-quality catering service with variety',
            'min_pex': 20,
            'per_pex': 75,
            'price': 12000,
            'purchase_price': 9500,
            'adult_selling_price': 13000,
            'adult_purchase_price': 10500,
            'child_selling_price': 9500,
            'child_purchase_price': 7500,
            'infant_selling_price': 4500,
            'infant_purchase_price': 3200,
            'active': True,
        },
        {
            'city': cities['JED'],
            'title': 'Airport Meal Service',
            'description': 'Quick meal service at Jeddah airport',
            'min_pex': 5,
            'per_pex': 20,
            'price': 3000,
            'purchase_price': 2200,
            'adult_selling_price': 3500,
            'adult_purchase_price': 2800,
            'child_selling_price': 2500,
            'child_purchase_price': 2000,
            'infant_selling_price': 1200,
            'infant_purchase_price': 800,
            'active': True,
        },
    ]
    
    food_count = 0
    for food_item in food_data:
        food = FoodPrice.objects.create(
            organization=org,
            **food_item
        )
        print(f"  ✅ Created food item: {food.title}")
        food_count += 1
    
    return food_count

def create_ziyarat_data(org, cities):
    """Create Ziyarat data"""
    print("\n🕌 Creating Ziyarat data...")
    
    ziyarat_data = [
        {
            'city': cities['MAK'],
            'ziarat_title': 'Makkah Historical Sites Tour',
            'description': 'Visit to Cave Hira, Jabal Noor, and other historical places',
            'contact_person': 'Ahmed Al-Makki',
            'contact_number': '+966125678901',
            'price': 12000,
            'purchase_price': 9500,
            'min_pex': 10,
            'max_pex': 45,
            'adult_selling_price': 13000,
            'adult_purchase_price': 10000,
            'child_selling_price': 8500,
            'child_purchase_price': 6500,
            'infant_selling_price': 4000,
            'infant_purchase_price': 2500,
            'status': 'active',
        },
        {
            'city': cities['MAK'],
            'ziarat_title': 'Full Day Makkah Ziyarat',
            'description': 'Complete tour of all historical and religious sites in Makkah',
            'contact_person': 'Bilal Abdullah',
            'contact_number': '+966126789012',
            'price': 18000,
            'purchase_price': 14500,
            'min_pex': 15,
            'max_pex': 50,
            'adult_selling_price': 19500,
            'adult_purchase_price': 15500,
            'child_selling_price': 13000,
            'child_purchase_price': 10000,
            'infant_selling_price': 6000,
            'infant_purchase_price': 4000,
            'status': 'active',
        },
        {
            'city': cities['MED'],
            'ziarat_title': 'Madinah Sacred Places Tour',
            'description': 'Visit to Masjid Quba, Jabal Uhud, and other sacred places',
            'contact_person': 'Hassan Al-Madani',
            'contact_number': '+966147890123',
            'price': 10000,
            'purchase_price': 7800,
            'min_pex': 8,
            'max_pex': 40,
            'adult_selling_price': 11000,
            'adult_purchase_price': 8500,
            'child_selling_price': 7500,
            'child_purchase_price': 5800,
            'infant_selling_price': 3500,
            'infant_purchase_price': 2200,
            'status': 'active',
        },
        {
            'city': cities['MED'],
            'ziarat_title': 'Complete Madinah Ziyarat Package',
            'description': 'Full day comprehensive tour of all Madinah attractions',
            'contact_person': 'Omar Rahman',
            'contact_number': '+966148901234',
            'price': 16000,
            'purchase_price': 12800,
            'min_pex': 12,
            'max_pex': 48,
            'adult_selling_price': 17500,
            'adult_purchase_price': 14000,
            'child_selling_price': 12000,
            'child_purchase_price': 9500,
            'infant_selling_price': 5500,
            'infant_purchase_price': 3800,
            'status': 'active',
        },
        {
            'city': cities['JED'],
            'ziarat_title': 'Jeddah City Tour',
            'description': 'Historical Jeddah and coastal areas tour',
            'contact_person': 'Khalid Al-Jeddawi',
            'contact_number': '+966129012345',
            'price': 8000,
            'purchase_price': 6200,
            'min_pex': 6,
            'max_pex': 30,
            'adult_selling_price': 9000,
            'adult_purchase_price': 7000,
            'child_selling_price': 6500,
            'child_purchase_price': 5000,
            'infant_selling_price': 3000,
            'infant_purchase_price': 2000,
            'status': 'active',
        },
    ]
    
    ziyarat_count = 0
    for ziyarat_item in ziyarat_data:
        ziyarat = ZiaratPrice.objects.create(
            organization=org,
            **ziyarat_item
        )
        print(f"  ✅ Created Ziyarat: {ziyarat.ziarat_title}")
        ziyarat_count += 1
    
    return ziyarat_count

def create_airlines_data(org):
    """Create airlines data"""
    print("\n✈️ Creating airlines data...")
    
    airlines_data = [
        {
            'name': 'Pakistan International Airlines (PIA)',
            'code': 'PK',
            'is_umrah_seat': True,
        },
        {
            'name': 'Saudi Arabian Airlines',
            'code': 'SV',
            'is_umrah_seat': True,
        },
        {
            'name': 'Emirates',
            'code': 'EK',
            'is_umrah_seat': True,
        },
        {
            'name': 'Qatar Airways',
            'code': 'QR',
            'is_umrah_seat': True,
        },
        {
            'name': 'Etihad Airways',
            'code': 'EY',
            'is_umrah_seat': True,
        },
        {
            'name': 'Flydubai',
            'code': 'FZ',
            'is_umrah_seat': True,
        },
    ]
    
    airline_count = 0
    for airline_data in airlines_data:
        airline, created = Airlines.objects.get_or_create(
            organization=org,
            code=airline_data['code'],
            defaults=airline_data
        )
        if created:
            print(f"  ✅ Created airline: {airline.name} ({airline.code})")
        else:
            print(f"  ℹ️ Airline exists: {airline.name} ({airline.code})")
        airline_count += 1
    
    return airline_count

def create_flight_data(org, cities, airlines):
    """Create flight/ticket data"""
    print("\n🛫 Creating flight data...")
    
    # Get airlines
    airlines_list = list(Airlines.objects.filter(organization=org))
    
    if not airlines_list:
        print("  ❌ No airlines found, skipping flight creation")
        return 0
    
    # Flight routes data
    flights_data = [
        {
            'origin': cities['KHI'],
            'destination': cities['JED'],
            'airline': 'PK',
            'flight_number': 'PK-747',
            'base_price_range': (85000, 120000),
        },
        {
            'origin': cities['LHE'],
            'destination': cities['JED'],
            'airline': 'PK',
            'flight_number': 'PK-749',
            'base_price_range': (90000, 125000),
        },
        {
            'origin': cities['ISB'],
            'destination': cities['RUH'],
            'airline': 'SV',
            'flight_number': 'SV-738',
            'base_price_range': (95000, 130000),
        },
        {
            'origin': cities['KHI'],
            'destination': cities['DXB'],
            'airline': 'EK',
            'flight_number': 'EK-606',
            'base_price_range': (75000, 105000),
        },
        {
            'origin': cities['LHE'],
            'destination': cities['DXB'],
            'airline': 'FZ',
            'flight_number': 'FZ-371',
            'base_price_range': (65000, 95000),
        },
        {
            'origin': cities['KHI'],
            'destination': cities['JED'],
            'airline': 'SV',
            'flight_number': 'SV-705',
            'base_price_range': (100000, 140000),
        },
    ]
    
    flight_count = 0
    for flight_data in flights_data:
        # Find the airline
        airline = next((a for a in airlines_list if a.code == flight_data['airline']), airlines_list[0])
        
        min_price, max_price = flight_data['base_price_range']
        base_adult_price = random.uniform(min_price, max_price)
        
        # Create multiple flights with different dates
        for i in range(3):  # Create 3 flights per route
            departure_date = date.today() + timedelta(days=7 + (i * 7))  # Weekly flights
            arrival_date = departure_date  # Same day arrival for simplicity
            
            ticket = Ticket.objects.create(
                organization=org,
                owner_organization_id=org.id,
                airline=airline,
                flight_number=f"{flight_data['flight_number']}-{i+1}",
                origin=flight_data['origin'],
                destination=flight_data['destination'],
                departure_date=departure_date,
                departure_time='14:30:00',
                arrival_date=arrival_date,
                arrival_time='18:45:00',
                adult_price=base_adult_price,
                child_price=base_adult_price * 0.8,
                infant_price=base_adult_price * 0.2,
                adult_purchase_price=base_adult_price * 0.75,
                child_purchase_price=base_adult_price * 0.6,
                infant_purchase_price=base_adult_price * 0.15,
                total_seats=180,
                left_seats=180,
                booked_tickets=0,
                confirmed_tickets=0,
                status='available',
                is_umrah_seat=True,
                trip_type='one_way',
                departure_stay_type='standard',
                return_stay_type='standard',
                baggage_weight=23,
                baggage_pieces=1,
                is_refundable=True,
                refund_rule='partially_refundable',
                reselling_allowed=True,
            )
            
            print(f"  ✅ Created flight: {ticket.flight_number} - {flight_data['origin'].name} to {flight_data['destination'].name} on {departure_date}")
            flight_count += 1
    
    return flight_count

def main():
    """Main function to populate all system data"""
    print("🚀 SAER Complete System Data Population")
    print("=" * 60)
    
    # Step 1: Get organization
    print("\n📋 Step 1: Getting organization...")
    org = get_saer_organization()
    
    # Step 2: Set up cities
    print("\n📋 Step 2: Setting up cities...")
    cities = get_or_create_cities(org)
    
    # Step 3: Create visa data
    print("\n📋 Step 3: Creating visa data...")
    visa_count = create_visa_data(org, cities)
    
    # Step 4: Create transport sectors
    print("\n📋 Step 4: Creating transport sectors...")
    small_sector_count, big_sector_count = create_transport_sectors(org, cities)
    
    # Get sectors for vehicle types
    small_sectors = list(Sector.objects.filter(organization=org))
    big_sectors = list(BigSector.objects.filter(organization=org))
    
    # Step 5: Create vehicle types
    print("\n📋 Step 5: Creating vehicle types...")
    vehicle_count = create_vehicle_types(org, small_sectors, big_sectors)
    
    # Step 6: Create transport sector prices
    print("\n📋 Step 6: Creating transport sector prices...")
    transport_price_count = create_transport_sector_prices(org)
    
    # Step 7: Create food data
    print("\n📋 Step 7: Creating food data...")
    food_count = create_food_data(org, cities)
    
    # Step 8: Create Ziyarat data
    print("\n📋 Step 8: Creating Ziyarat data...")
    ziyarat_count = create_ziyarat_data(org, cities)
    
    # Step 9: Create airlines
    print("\n📋 Step 9: Creating airlines...")
    airline_count = create_airlines_data(org)
    
    # Step 10: Create flight data
    print("\n📋 Step 10: Creating flight data...")
    flight_count = create_flight_data(org, cities, airline_count)
    
    # Final summary
    print("\n" + "=" * 60)
    print("🎉 DATA POPULATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"✅ Organization: {org.name} ({org.org_code})")
    print(f"✅ Cities: {len(cities)} created/found")
    print(f"✅ Visa Records: {visa_count} created")
    print(f"✅ Small Sectors: {small_sector_count} created")
    print(f"✅ Big Sectors: {big_sector_count} created")
    print(f"✅ Vehicle Types: {vehicle_count} created")
    print(f"✅ Transport Prices: {transport_price_count} created")
    print(f"✅ Food Items: {food_count} created")
    print(f"✅ Ziyarat Packages: {ziyarat_count} created")
    print(f"✅ Airlines: {airline_count} created")
    print(f"✅ Flights: {flight_count} created")
    
    print("\n📋 Data Categories Created:")
    print("   💳 Visa Services:")
    print("     - Standard/Express/Premium Umrah visas")
    print("     - Only visa options")
    print("     - Long-term visa options")
    print("   🚌 Transport Services:")
    print("     - Airport pickup/drop services")
    print("     - Hotel to hotel transfers")
    print("     - Complete transport packages")
    print("   🍽️ Food Services:")
    print("     - Standard/Premium meal options")
    print("     - City-specific catering")
    print("     - Airport meal services")
    print("   🕌 Ziyarat Services:")
    print("     - Makkah historical sites tours")
    print("     - Madinah sacred places tours")
    print("     - Complete ziyarat packages")
    print("   ✈️ Flight Services:")
    print("     - Multiple airlines (PIA, Saudi, Emirates, etc.)")
    print("     - Various routes (Pakistan to KSA/UAE)")
    print("     - Weekly flight schedules")
    
    print("\nReady for comprehensive booking operations! 🎯")

if __name__ == "__main__":
    main()