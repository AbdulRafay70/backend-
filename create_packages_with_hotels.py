"""
Script to create Umrah packages with different hotels and complete details.
Each package will have:
- Ticket details (PIA flights)
- Hotel details (Makkah and Madinah hotels)
- Transport details
- Food options
- Ziyarat options
- Complete pricing information
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import (
    UmrahPackage, UmrahPackageTicketDetails, UmrahPackageHotelDetails,
    UmrahPackageTransportDetails, UmrahPackageFoodDetails, UmrahPackageZiyaratDetails,
    TransportSector, FoodOption, ZiyaratOption
)
from tickets.models import Ticket, TicketTripDetails, Hotels
from organization.models import Organization
from django.utils import timezone

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("CREATING UMRAH PACKAGES WITH HOTELS")
print("="*80)

# Get existing tickets
tickets = list(Ticket.objects.filter(organization=org, airline__name='PIA').order_by('id'))
print(f"\nFound {len(tickets)} PIA tickets")

# Get hotels
makkah_hotels = list(Hotels.objects.filter(organization=org, city__name='Makkah').order_by('id'))
madinah_hotels = list(Hotels.objects.filter(organization=org, city__name='Madinah').order_by('id'))
print(f"Found {len(makkah_hotels)} Makkah hotels and {len(madinah_hotels)} Madinah hotels")

# Get transport, food, ziyarat options
transports = list(TransportSector.objects.filter(organization=org))
foods = list(FoodOption.objects.filter(organization=org))
ziyarats = list(ZiyaratOption.objects.filter(organization=org))

# Delete existing packages to start fresh
UmrahPackage.objects.filter(organization=org).delete()
print("\nDeleted existing packages")

# Package configurations
packages_config = [
    {
        'name': 'Economy Umrah Package',
        'description': 'Affordable Umrah package with comfortable 4-star hotels',
        'duration_days': 14,
        'makkah_hotel_idx': 0,  # Makkah Grand Hotel
        'madinah_hotel_idx': 0,  # Madinah Hilton
        'ticket_idx': 0,
        'base_price': 150000,
    },
    {
        'name': 'Standard Umrah Package',
        'description': 'Well-balanced package with excellent 5-star accommodations',
        'duration_days': 21,
        'makkah_hotel_idx': 1,  # Al Safwah Royale Orchid
        'madinah_hotel_idx': 1,  # Al Madinah Harmony Hotel
        'ticket_idx': 1,
        'base_price': 250000,
    },
    {
        'name': 'Premium Umrah Package',
        'description': 'Luxury package with premium hotels near Haram',
        'duration_days': 21,
        'makkah_hotel_idx': 2,  # Makkah Clock Tower
        'madinah_hotel_idx': 0,  # Madinah Hilton
        'ticket_idx': 2,
        'base_price': 350000,
    },
    {
        'name': 'VIP Umrah Package',
        'description': 'Ultimate luxury experience with 5-star hotels',
        'duration_days': 28,
        'makkah_hotel_idx': 1,  # Al Safwah Royale Orchid
        'madinah_hotel_idx': 1,  # Al Madinah Harmony Hotel
        'ticket_idx': 3,
        'base_price': 450000,
    },
    {
        'name': 'Family Umrah Package',
        'description': 'Perfect for families with spacious accommodations',
        'duration_days': 21,
        'makkah_hotel_idx': 0,  # Makkah Grand Hotel
        'madinah_hotel_idx': 1,  # Al Madinah Harmony Hotel
        'ticket_idx': 4,
        'base_price': 200000,
    },
]

created_packages = []

for idx, config in enumerate(packages_config):
    if config['ticket_idx'] >= len(tickets):
        print(f"Skipping package {config['name']} - no ticket available")
        continue
    
    if config['makkah_hotel_idx'] >= len(makkah_hotels) or config['madinah_hotel_idx'] >= len(madinah_hotels):
        print(f"Skipping package {config['name']} - hotels not available")
        continue
    
    print(f"\nCreating: {config['name']}")
    
    # Create package
    package = UmrahPackage.objects.create(
        organization=org,
        name=config['name'],
        description=config['description'],
        duration_days=config['duration_days'],
        base_price=config['base_price'],
        adult_price=config['base_price'],
        child_price=config['base_price'] * 0.7,
        infant_price=config['base_price'] * 0.3,
        is_active=True,
        reselling_allowed=True,
        inventory_owner_organization_id=org.id,
    )
    
    # Add ticket
    ticket = tickets[config['ticket_idx']]
    UmrahPackageTicketDetails.objects.create(
        package=package,
        ticket=ticket,
        quantity=1,
        price_per_ticket=50000
    )
    print(f"  ✓ Added ticket: {ticket.ticket_number}")
    
    # Add Makkah hotel
    makkah_hotel = makkah_hotels[config['makkah_hotel_idx']]
    UmrahPackageHotelDetails.objects.create(
        package=package,
        hotel=makkah_hotel,
        nights=config['duration_days'] // 2,
        room_type='double',
        price_per_night=5000,
        check_in_date=timezone.now().date(),
        check_out_date=(timezone.now() + timedelta(days=config['duration_days']//2)).date()
    )
    print(f"  ✓ Added Makkah hotel: {makkah_hotel.name}")
    
    # Add Madinah hotel
    madinah_hotel = madinah_hotels[config['madinah_hotel_idx']]
    UmrahPackageHotelDetails.objects.create(
        package=package,
        hotel=madinah_hotel,
        nights=config['duration_days'] // 2,
        room_type='double',
        price_per_night=4000,
        check_in_date=(timezone.now() + timedelta(days=config['duration_days']//2)).date(),
        check_out_date=(timezone.now() + timedelta(days=config['duration_days'])).date()
    )
    print(f"  ✓ Added Madinah hotel: {madinah_hotel.name}")
    
    # Add transport
    if transports:
        transport = transports[idx % len(transports)]
        UmrahPackageTransportDetails.objects.create(
            package=package,
            transport_sector=transport,
            quantity=1,
            price_per_unit=15000
        )
        print(f"  ✓ Added transport: {transport.name}")
    
    # Add food
    if foods:
        food = foods[idx % len(foods)]
        UmrahPackageFoodDetails.objects.create(
            package=package,
            food_option=food,
            quantity=config['duration_days'],
            price_per_unit=1000
        )
        print(f"  ✓ Added food: {food.name}")
    
    # Add ziyarat
    if ziyarats:
        ziyarat = ziyarats[idx % len(ziyarats)]
        UmrahPackageZiyaratDetails.objects.create(
            package=package,
            ziyarat_option=ziyarat,
            quantity=1,
            price_per_unit=10000
        )
        print(f"  ✓ Added ziyarat: {ziyarat.name}")
    
    created_packages.append(package)

print("\n" + "="*80)
print(f"✅ Created {len(created_packages)} Umrah packages with complete details!")
print("="*80)

# Summary
print("\nPackage Summary:")
for pkg in created_packages:
    hotels = UmrahPackageHotelDetails.objects.filter(package=pkg)
    makkah = hotels.filter(hotel__city__name='Makkah').first()
    madinah = hotels.filter(hotel__city__name='Madinah').first()
    
    print(f"\n{pkg.name}:")
    print(f"  Duration: {pkg.duration_days} days")
    print(f"  Price: {pkg.base_price:,} PKR")
    print(f"  Makkah: {makkah.hotel.name if makkah else 'N/A'} ({makkah.nights if makkah else 0} nights)")
    print(f"  Madinah: {madinah.hotel.name if madinah else 'N/A'} ({madinah.nights if madinah else 0} nights)")
    print(f"  Ticket: {pkg.ticket_details.first().ticket.ticket_number if pkg.ticket_details.first() else 'N/A'}")
