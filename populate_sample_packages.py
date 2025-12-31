"""
Script to populate the database with sample PIA tickets and Umrah packages
for organization 11 with various combinations of transport, food, and ziyarat.
"""
import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.utils import timezone
from packages.models import (
    UmrahPackage, UmrahPackageTicketDetails, UmrahPackageTransportDetails,
    TransportSectorPrice, FoodPrice, ZiaratPrice, City
)
from tickets.models import Ticket, TicketTripDetails, Airlines, Hotels
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

# Get or create PIA airline
pia, _ = Airlines.objects.get_or_create(
    organization=org,
    code='PK',
    defaults={'name': 'PIA - Pakistan International Airlines', 'is_umrah_seat': True}
)

# Get or create cities
makkah = City.objects.filter(organization=org, code='MKH').first()
if not makkah:
    makkah = City.objects.create(organization=org, code='MKH', name='Makkah')

madinah = City.objects.filter(organization=org, code='MDN').first()
if not madinah:
    madinah = City.objects.create(organization=org, code='MDN', name='Madinah')

jeddah = City.objects.filter(organization=org, code='JED').first()
if not jeddah:
    jeddah = City.objects.create(organization=org, code='JED', name='Jeddah')

# Create Islamabad city if it doesn't exist
islamabad = City.objects.filter(organization=org, code='ISB').first()
if not islamabad:
    islamabad = City.objects.create(organization=org, code='ISB', name='Islamabad')

print("Creating PIA tickets for the next 7 days...")

# Create 7 tickets (one for each day of the week)
tickets = []
today = timezone.now()

for i in range(7):
    departure_date = today + timedelta(days=i)
    return_date = departure_date + timedelta(days=14)  # 14-day trip
    
    # Create ticket
    ticket = Ticket.objects.create(
        organization=org,
        airline=pia,
        pnr=f'PK{1000+i}',
        adult_price=50000 + (i * 1000),  # Varying prices
        child_price=40000 + (i * 800),
        infant_price=10000 + (i * 200),
        total_seats=100,
        left_seats=100,
        is_umrah_seat=True
    )
    
    # Create outbound trip
    TicketTripDetails.objects.create(
        ticket=ticket,
        departure_city=islamabad,
        arrival_city=jeddah,
        departure_date_time=departure_date,
        arrival_date_time=departure_date + timedelta(hours=5),
        flight_number=f'PK{200+i}',
        trip_type='outbound'
    )
    
    # Create return trip
    TicketTripDetails.objects.create(
        ticket=ticket,
        departure_city=jeddah,
        arrival_city=islamabad,
        departure_date_time=return_date,
        arrival_date_time=return_date + timedelta(hours=5),
        flight_number=f'PK{300+i}',
        trip_type='return'
    )
    
    tickets.append(ticket)
    print(f"  ✓ Created ticket {ticket.pnr} - Departure: {departure_date.strftime('%Y-%m-%d')}")

print(f"\nCreated {len(tickets)} PIA tickets")

# Get or create transport sectors
print("\nCreating transport sectors...")
transport_sectors = []
sector_names = [
    'Jeddah Airport to Makkah Hotel',
    'Makkah to Madinah',
    'Madinah to Jeddah Airport',
    'Full Package Transport'
]

for idx, name in enumerate(sector_names):
    sector, created = TransportSectorPrice.objects.get_or_create(
        organization=org,
        name=name,
        defaults={
            'reference': f'type{idx+1}',
            'adult_selling_price': 5000 + (idx * 500),
            'adult_purchase_price': 4000 + (idx * 400),
            'child_selling_price': 3000 + (idx * 300),
            'child_purchase_price': 2500 + (idx * 250),
            'infant_selling_price': 1000,
            'infant_purchase_price': 800,
        }
    )
    transport_sectors.append(sector)
    status = "Created" if created else "Found"
    print(f"  ✓ {status} transport sector: {name}")

# Get or create food options
print("\nCreating food options...")
food_options = []
food_names = ['Standard Meals', 'Premium Meals', 'Buffet Package']

for idx, name in enumerate(food_names):
    food, created = FoodPrice.objects.get_or_create(
        organization=org,
        title=name,
        city=makkah,
        defaults={
            'description': f'{name} - Full board meals',
            'adult_selling_price': 3000 + (idx * 500),
            'adult_purchase_price': 2500 + (idx * 400),
            'child_selling_price': 2000 + (idx * 300),
            'child_purchase_price': 1500 + (idx * 200),
            'infant_selling_price': 500,
            'infant_purchase_price': 400,
            'active': True,
            'min_pex': 1,
            'per_pex': 1
        }
    )
    food_options.append(food)
    status = "Created" if created else "Found"
    print(f"  ✓ {status} food option: {name}")

# Get or create ziyarat options
print("\nCreating ziyarat options...")
ziyarat_options = []
ziyarat_names = [
    'Makkah Historical Sites',
    'Madinah Historical Sites',
    'Combined Ziyarat Package'
]

for idx, name in enumerate(ziyarat_names):
    city = makkah if idx == 0 else (madinah if idx == 1 else makkah)
    ziyarat, created = ZiaratPrice.objects.get_or_create(
        organization=org,
        ziarat_title=name,
        city=city,
        defaults={
            'description': f'Guided tour of {name}',
            'contact_person': 'Tour Coordinator',
            'contact_number': '+966-XXX-XXXX',
            'adult_selling_price': 4000 + (idx * 1000),
            'adult_purchase_price': 3000 + (idx * 800),
            'child_selling_price': 2000 + (idx * 500),
            'child_purchase_price': 1500 + (idx * 400),
            'infant_selling_price': 0,
            'infant_purchase_price': 0,
            'status': 'active',
            'min_pex': 5,
            'max_pex': 50
        }
    )
    ziyarat_options.append(ziyarat)
    status = "Created" if created else "Found"
    print(f"  ✓ {status} ziyarat option: {name}")

# Create Umrah packages with different combinations
print("\nCreating Umrah packages...")
packages_created = 0

package_configs = [
    {
        'title': 'Economy Umrah Package',
        'transport_idx': 0,
        'food_idx': 0,
        'ziyarat_idx': 0,
        'ticket_idx': 0,
        'visa_price': 15000
    },
    {
        'title': 'Standard Umrah Package',
        'transport_idx': 1,
        'food_idx': 1,
        'ziyarat_idx': 1,
        'ticket_idx': 1,
        'visa_price': 18000
    },
    {
        'title': 'Premium Umrah Package',
        'transport_idx': 2,
        'food_idx': 2,
        'ziyarat_idx': 2,
        'ticket_idx': 2,
        'visa_price': 22000
    },
    {
        'title': 'Deluxe Umrah Package',
        'transport_idx': 3,
        'food_idx': 2,
        'ziyarat_idx': 2,
        'ticket_idx': 3,
        'visa_price': 25000
    },
    {
        'title': 'Family Umrah Package',
        'transport_idx': 1,
        'food_idx': 1,
        'ziyarat_idx': 0,
        'ticket_idx': 4,
        'visa_price': 20000
    },
    {
        'title': 'Quick Umrah Package',
        'transport_idx': 0,
        'food_idx': 0,
        'ziyarat_idx': None,  # No ziyarat
        'ticket_idx': 5,
        'visa_price': 16000
    },
    {
        'title': 'VIP Umrah Package',
        'transport_idx': 3,
        'food_idx': 2,
        'ziyarat_idx': 2,
        'ticket_idx': 6,
        'visa_price': 30000
    },
]

for config in package_configs:
    ticket = tickets[config['ticket_idx']]
    transport = transport_sectors[config['transport_idx']]
    food = food_options[config['food_idx']]
    ziyarat = ziyarat_options[config['ziyarat_idx']] if config['ziyarat_idx'] is not None else None
    
    # Create package
    package = UmrahPackage.objects.create(
        organization=org,
        title=config['title'],
        description=f"Complete {config['title']} with flights, transport, accommodation, and services",
        package_type='umrah',
        status='active',
        is_active=True,
        max_capacity=50,
        total_seats=50,
        left_seats=50,
        adault_visa_selling_price=config['visa_price'],
        adault_visa_purchase_price=config['visa_price'] - 2000,
        child_visa_selling_price=config['visa_price'] * 0.7,
        child_visa_purchase_price=(config['visa_price'] - 2000) * 0.7,
        infant_visa_selling_price=5000,
        infant_visa_purchase_price=4000,
        food_selling_price=food.adult_selling_price,
        food_purchase_price=food.adult_purchase_price,
        food_price_id=food.id,
        reselling_allowed=True
    )
    
    # Add ziyarat prices if included
    if ziyarat:
        package.makkah_ziyarat_selling_price = ziyarat.adult_selling_price
        package.makkah_ziyarat_purchase_price = ziyarat.adult_purchase_price
        package.makkah_ziyarat_id = ziyarat.id
        package.save()
    
    # Link ticket to package
    UmrahPackageTicketDetails.objects.create(
        package=package,
        ticket=ticket
    )
    
    # Link transport to package
    UmrahPackageTransportDetails.objects.create(
        package=package,
        transport_sector=transport,
        transport_selling_price=transport.adult_selling_price,
        transport_purchase_price=transport.adult_purchase_price
    )
    
    packages_created += 1
    print(f"  ✓ Created: {config['title']}")
    print(f"    - Ticket: {ticket.pnr}")
    print(f"    - Transport: {transport.name}")
    print(f"    - Food: {food.title}")
    if ziyarat:
        print(f"    - Ziyarat: {ziyarat.ziarat_title}")

print(f"\n{'='*60}")
print(f"✅ Successfully created {packages_created} Umrah packages!")
print(f"{'='*60}")
print(f"\nYou can now view them at:")
print(f"https://api.saer.pk/api/umrah-packages/?organization=11&include_past=true")
