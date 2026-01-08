"""
Script to create 10 complete Umrah packages using:
- Hotels (created in populate_hotels.py)
- Tickets/Flights (created earlier)
- Visa pricing
- Transport, Food, Ziyarat options
- Complete pricing for all bed types (Sharing, Quint, Quad, Triple, Double)
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
    UmrahPackageHotelDetails, TransportSectorPrice, FoodPrice, ZiaratPrice,
    PackageInclusion, PackageExclusion
)
from tickets.models import Ticket, Hotels, TicketTripDetails
from organization.models import Organization

print("="*80)
print("🎯 CREATING 10 COMPLETE UMRAH PACKAGES")
print("="*80)

# Get organization
try:
    org = Organization.objects.get(id=52)
    print(f"\n✓ Using organization: {org.name} (ID: {org.id})")
except Organization.DoesNotExist:
    org = Organization.objects.first()
    print(f"\n✓ Using first organization: {org.name} (ID: {org.id})")

# Get resources
makkah_hotels = list(Hotels.objects.filter(organization=org, city__name='Makkah').order_by('id'))
madinah_hotels = list(Hotels.objects.filter(organization=org, city__name='Madinah').order_by('id'))
tickets = list(Ticket.objects.filter(organization=org).order_by('id'))
transport_sectors = list(TransportSectorPrice.objects.filter(organization=org).order_by('id'))
food_options = list(FoodPrice.objects.filter(organization=org).order_by('id'))
ziyarat_options = list(ZiaratPrice.objects.filter(organization=org).order_by('id'))

print(f"\n📊 Available Resources:")
print(f"   - Makkah Hotels: {len(makkah_hotels)}")
print(f"   - Madinah Hotels: {len(madinah_hotels)}")
print(f"   - Tickets: {len(tickets)}")
print(f"   - Transport Sectors: {len(transport_sectors)}")
print(f"   - Food Options: {len(food_options)}")
print(f"   - Ziyarat Options: {len(ziyarat_options)}")

# Delete existing packages to start fresh
deleted_count = UmrahPackage.objects.filter(organization=org).count()
UmrahPackage.objects.filter(organization=org).delete()
print(f"\n🗑️  Deleted {deleted_count} existing packages")

# Helper function to get hotel prices
def get_hotel_prices(hotel):
    """Get hotel prices for all bed types (latest available prices)"""
    prices = {
        'sharing': 0,
        'quint': 0,
        'quad': 0,
        'triple': 0,
        'double': 0,
        'room': 0,
    }
    
    if hotel:
        # Get the latest prices for each room type
        current_date = datetime.now().date()
        hotel_prices = hotel.prices.filter(
            start_date__lte=current_date,
            end_date__gte=current_date
        )
        
        # If no current prices, get the first available prices
        if not hotel_prices.exists():
            hotel_prices = hotel.prices.all()
        
        # Map room types to our price keys
        for hp in hotel_prices:
            if hp.room_type == 'sharing':
                prices['sharing'] = float(hp.price)
            elif hp.room_type == 'quint':
                prices['quint'] = float(hp.price)
            elif hp.room_type == 'quad':
                prices['quad'] = float(hp.price)
            elif hp.room_type == 'triple':
                prices['triple'] = float(hp.price)
            elif hp.room_type == 'double':
                prices['double'] = float(hp.price)
            elif hp.room_type == 'room':
                prices['room'] = float(hp.price)
    
    return prices

# Package configurations - 10 diverse packages
package_configs = [
    {
        'title': '⭐ Economy Umrah Package - 14 Days',
        'description': 'Affordable Umrah package with comfortable 3-star hotels and all essentials included. Perfect for budget-conscious pilgrims.',
        'max_capacity': 60,
        'makkah_hotel_idx': 2,  # 3-star hotel
        'madinah_hotel_idx': 2,
        'makkah_nights': 7,
        'madinah_nights': 7,
        'ticket_idx': 0,
        'transport_idx': 0,
        'food_idx': 0,
        'ziyarat_idx': 0,
        'visa_adult': 25000,
        'visa_child': 18000,
        'visa_infant': 8000,
    },
    {
        'title': '⭐⭐ Standard Umrah Package - 14 Days',
        'description': 'Well-balanced Umrah package with 4-star hotels near Haram. Includes guided Ziyarat tours in Makkah and Madinah.',
        'max_capacity': 50,
        'makkah_hotel_idx': 1,  # 4-star hotel
        'madinah_hotel_idx': 1,
        'makkah_nights': 7,
        'madinah_nights': 7,
        'ticket_idx': 1,
        'transport_idx': 1,
        'food_idx': 1,
        'ziyarat_idx': 1,
        'visa_adult': 28000,
        'visa_child': 20000,
        'visa_infant': 9000,
    },
    {
        'title': '⭐⭐⭐ Premium Umrah Package - 15 Days',
        'description': 'Luxury 5-star hotels with walking distance to Haram. Premium meals, VIP transport, and comprehensive Ziyarat tours.',
        'max_capacity': 40,
        'makkah_hotel_idx': 0,  # 5-star hotel
        'madinah_hotel_idx': 0,
        'makkah_nights': 8,
        'madinah_nights': 7,
        'ticket_idx': 2,
        'transport_idx': 2,
        'food_idx': 2,
        'ziyarat_idx': 2,
        'visa_adult': 32000,
        'visa_child': 23000,
        'visa_infant': 10000,
    },
    {
        'title': '👑 VIP Luxury Umrah Package - 21 Days',
        'description': 'Ultimate luxury experience with Burj Al Arab stay in Dubai, 5-star hotels with Haram view, and exclusive services.',
        'max_capacity': 25,
        'makkah_hotel_idx': 0,
        'madinah_hotel_idx': 0,
        'makkah_nights': 10,
        'madinah_nights': 11,
        'ticket_idx': 3,
        'transport_idx': 2,
        'food_idx': 2,
        'ziyarat_idx': 2,
        'visa_adult': 38000,
        'visa_child': 28000,
        'visa_infant': 12000,
    },
    {
        'title': '🌙 Ramadan Special Package - 15 Days',
        'description': 'Special Ramadan package with Iftar and Suhoor arrangements, 4-star hotels, and extended Ziyarat tours.',
        'max_capacity': 55,
        'makkah_hotel_idx': 1,
        'madinah_hotel_idx': 1,
        'makkah_nights': 8,
        'madinah_nights': 7,
        'ticket_idx': 4,
        'transport_idx': 1,
        'food_idx': 1,
        'ziyarat_idx': 1,
        'visa_adult': 35000,
        'visa_child': 25000,
        'visa_infant': 11000,
    },
    {
        'title': '👨‍👩‍👧‍👦 Family Umrah Package - 14 Days',
        'description': 'Family-friendly package with spacious rooms, kids-friendly meals, and family-oriented services. Great for large groups.',
        'max_capacity': 70,
        'makkah_hotel_idx': 1,
        'madinah_hotel_idx': 1,
        'makkah_nights': 7,
        'madinah_nights': 7,
        'ticket_idx': 5,
        'transport_idx': 0,
        'food_idx': 0,
        'ziyarat_idx': 0,
        'visa_adult': 26000,
        'visa_child': 19000,
        'visa_infant': 8500,
    },
    {
        'title': '⚡ Quick Umrah Package - 7 Days',
        'description': 'Express Umrah package for busy professionals. 3-star hotels, quick Ziyarat, efficient schedule.',
        'max_capacity': 45,
        'makkah_hotel_idx': 2,
        'madinah_hotel_idx': 2,
        'makkah_nights': 4,
        'madinah_nights': 3,
        'ticket_idx': 6,
        'transport_idx': 0,
        'food_idx': 0,
        'ziyarat_idx': 0,
        'visa_adult': 22000,
        'visa_child': 16000,
        'visa_infant': 7000,
    },
    {
        'title': '🕋 Extended Umrah Package - 30 Days',
        'description': 'Extended stay for spiritual seekers. 4-star hotels, full board, multiple Ziyarat tours, and flexible schedule.',
        'max_capacity': 35,
        'makkah_hotel_idx': 1,
        'madinah_hotel_idx': 1,
        'makkah_nights': 15,
        'madinah_nights': 15,
        'ticket_idx': 7,
        'transport_idx': 1,
        'food_idx': 1,
        'ziyarat_idx': 1,
        'visa_adult': 42000,
        'visa_child': 32000,
        'visa_infant': 15000,
    },
    {
        'title': '🌟 Golden Umrah Package - 20 Days',
        'description': 'Premium 5-star experience with Pullman ZamZam and Madinah Hilton. Includes all services and VIP treatment.',
        'max_capacity': 30,
        'makkah_hotel_idx': 0,
        'madinah_hotel_idx': 0,
        'makkah_nights': 10,
        'madinah_nights': 10,
        'ticket_idx': 8,
        'transport_idx': 2,
        'food_idx': 2,
        'ziyarat_idx': 2,
        'visa_adult': 45000,
        'visa_child': 35000,
        'visa_infant': 18000,
    },
    {
        'title': '💎 Diamond Elite Umrah Package - 25 Days',
        'description': 'Ultra-luxury package with Burj Khalifa stay, 5-star Haram-view hotels, private transport, and concierge services.',
        'max_capacity': 20,
        'makkah_hotel_idx': 0,
        'madinah_hotel_idx': 0,
        'makkah_nights': 13,
        'madinah_nights': 12,
        'ticket_idx': 9,
        'transport_idx': 2,
        'food_idx': 2,
        'ziyarat_idx': 2,
        'visa_adult': 50000,
        'visa_child': 40000,
        'visa_infant': 20000,
    },
]

print(f"\n{'='*80}")
print("🏗️  Creating Packages...")
print("="*80)

packages_created = 0
current_date = timezone.now().date()

for idx, config in enumerate(package_configs, 1):
    print(f"\n[{idx}/10] Creating: {config['title']}")
    
    # Validate indices
    if config['makkah_hotel_idx'] >= len(makkah_hotels):
        print(f"   ⚠️  Skipping - Makkah hotel not available")
        continue
    
    if config['madinah_hotel_idx'] >= len(madinah_hotels):
        print(f"   ⚠️  Skipping - Madinah hotel not available")
        continue
    
    if config['ticket_idx'] >= len(tickets):
        print(f"   ⚠️  Skipping - Ticket not available")
        continue
    
    # Get resources
    makkah_hotel = makkah_hotels[config['makkah_hotel_idx']]
    madinah_hotel = madinah_hotels[config['madinah_hotel_idx']]
    ticket = tickets[config['ticket_idx']]
    
    # Get optional resources with fallbacks
    transport = transport_sectors[config['transport_idx']] if config['transport_idx'] < len(transport_sectors) else None
    food = food_options[config['food_idx']] if config['food_idx'] < len(food_options) else None
    ziyarat = ziyarat_options[config['ziyarat_idx']] if config['ziyarat_idx'] < len(ziyarat_options) else None
    
    # Get hotel prices
    makkah_prices = get_hotel_prices(makkah_hotel)
    madinah_prices = get_hotel_prices(madinah_hotel)
    
    # Create package
    package = UmrahPackage.objects.create(
        organization=org,
        title=config['title'],
        description=config['description'],
        package_type='umrah',
        status='active',
        is_active=True,
        start_date=current_date,
        end_date=current_date + timedelta(days=365),
        max_capacity=config['max_capacity'],
        total_seats=config['max_capacity'],
        left_seats=config['max_capacity'],
        booked_seats=0,
        confirmed_seats=0,
        
        # Visa pricing
        adault_visa_selling_price=config['visa_adult'],
        adault_visa_purchase_price=config['visa_adult'] - 3000,
        child_visa_selling_price=config['visa_child'],
        child_visa_purchase_price=config['visa_child'] - 2000,
        infant_visa_selling_price=config['visa_infant'],
        infant_visa_purchase_price=config['visa_infant'] - 1000,
        
        # Food pricing
        food_selling_price=food.adult_selling_price if food else 8000,
        food_purchase_price=food.adult_purchase_price if food else 6000,
        food_price_id=food.id if food else None,
        
        # Ziyarat pricing
        makkah_ziyarat_selling_price=ziyarat.adult_selling_price if ziyarat else 5000,
        makkah_ziyarat_purchase_price=ziyarat.adult_purchase_price if ziyarat else 4000,
        makkah_ziyarat_id=ziyarat.id if ziyarat else None,
        madinah_ziyarat_selling_price=ziyarat.adult_selling_price if ziyarat else 4500,
        madinah_ziyarat_purchase_price=ziyarat.adult_purchase_price if ziyarat else 3500,
        
        # Transport pricing
        transport_selling_price=transport.adult_selling_price if transport else 6000,
        transport_purchase_price=transport.adult_purchase_price if transport else 5000,
        
        # Room type activation
        is_quaint_active=True,
        is_sharing_active=True,
        is_quad_active=True,
        is_triple_active=True,
        is_double_active=True,
        
        # Service charges
        adault_service_charge=2000,
        child_service_charge=1000,
        infant_service_charge=500,
        is_service_charge_active=True,
        
        # Partial payment
        is_partial_payment_active=True,
        min_partial_percent=30,
        
        # Age restrictions
        filght_min_adault_age=12,
        filght_max_adault_age=65,
        max_chilld_allowed=10,
        max_infant_allowed=5,
        
        # Multi-organization
        reselling_allowed=True,
        is_public=True,
        
        # Pricing
        profit_percent=10,
    )
    
    # Link ticket to package
    UmrahPackageTicketDetails.objects.create(
        package=package,
        ticket=ticket
    )
    print(f"   ✓ Linked Ticket: {ticket.pnr}")
    
    # Add Makkah hotel details
    UmrahPackageHotelDetails.objects.create(
        package=package,
        hotel=makkah_hotel,
        check_in_date=current_date + timedelta(days=2),
        check_out_date=current_date + timedelta(days=2 + config['makkah_nights']),
        number_of_nights=config['makkah_nights'],
        # Selling prices
        quaint_bed_selling_price=makkah_prices['quint'] * config['makkah_nights'],
        sharing_bed_selling_price=makkah_prices['sharing'] * config['makkah_nights'],
        quad_bed_selling_price=makkah_prices['quad'] * config['makkah_nights'],
        triple_bed_selling_price=makkah_prices['triple'] * config['makkah_nights'],
        double_bed_selling_price=makkah_prices['double'] * config['makkah_nights'],
        # Purchase prices (20% discount)
        quaint_bed_purchase_price=makkah_prices['quint'] * config['makkah_nights'] * 0.8,
        sharing_bed_purchase_price=makkah_prices['sharing'] * config['makkah_nights'] * 0.8,
        quad_bed_purchase_price=makkah_prices['quad'] * config['makkah_nights'] * 0.8,
        triple_bed_purchase_price=makkah_prices['triple'] * config['makkah_nights'] * 0.8,
        double_bed_purchase_price=makkah_prices['double'] * config['makkah_nights'] * 0.8,
    )
    print(f"   ✓ Added Makkah Hotel: {makkah_hotel.name} ({config['makkah_nights']} nights)")
    
    # Add Madinah hotel details
    UmrahPackageHotelDetails.objects.create(
        package=package,
        hotel=madinah_hotel,
        check_in_date=current_date + timedelta(days=2 + config['makkah_nights']),
        check_out_date=current_date + timedelta(days=2 + config['makkah_nights'] + config['madinah_nights']),
        number_of_nights=config['madinah_nights'],
        # Selling prices
        quaint_bed_selling_price=madinah_prices['quint'] * config['madinah_nights'],
        sharing_bed_selling_price=madinah_prices['sharing'] * config['madinah_nights'],
        quad_bed_selling_price=madinah_prices['quad'] * config['madinah_nights'],
        triple_bed_selling_price=madinah_prices['triple'] * config['madinah_nights'],
        double_bed_selling_price=madinah_prices['double'] * config['madinah_nights'],
        # Purchase prices (20% discount)
        quaint_bed_purchase_price=madinah_prices['quint'] * config['madinah_nights'] * 0.8,
        sharing_bed_purchase_price=madinah_prices['sharing'] * config['madinah_nights'] * 0.8,
        quad_bed_purchase_price=madinah_prices['quad'] * config['madinah_nights'] * 0.8,
        triple_bed_purchase_price=madinah_prices['triple'] * config['madinah_nights'] * 0.8,
        double_bed_purchase_price=madinah_prices['double'] * config['madinah_nights'] * 0.8,
    )
    print(f"   ✓ Added Madinah Hotel: {madinah_hotel.name} ({config['madinah_nights']} nights)")
    
    # Add transport details
    if transport:
        UmrahPackageTransportDetails.objects.create(
            package=package,
            transport_sector=transport,
            vehicle_type='coaster',
            transport_type='private',
            transport_selling_price=transport.adult_selling_price,
            transport_purchase_price=transport.adult_purchase_price,
        )
        print(f"   ✓ Added Transport: {transport.name}")
    
    # Add package inclusions
    inclusions_data = [
        {"title": "Umrah Visa Processing", "description": "Complete visa processing with documentation support", "display_order": 1},
        {"title": f"{config['makkah_nights']} Nights in Makkah", "description": f"{makkah_hotel.name} ({makkah_hotel.category})", "display_order": 2},
        {"title": f"{config['madinah_nights']} Nights in Madinah", "description": f"{madinah_hotel.name} ({madinah_hotel.category})", "display_order": 3},
        {"title": "Return Flight Tickets", "description": f"{ticket.airline.name if ticket.airline else 'Airlines'} - {ticket.pnr}", "display_order": 4},
        {"title": "Airport Transfers", "description": "Round-trip airport transfers in comfortable vehicles", "display_order": 5},
        {"title": "Makkah-Madinah Transport", "description": "Comfortable transport between holy cities", "display_order": 6},
        {"title": "Breakfast & Dinner", "description": "Daily meals as per package", "display_order": 7},
        {"title": "Ziyarat Tours", "description": "Guided tours of holy sites in Makkah and Madinah", "display_order": 8},
        {"title": "Tour Guide Services", "description": "Experienced multilingual tour guides", "display_order": 9},
        {"title": "24/7 Support", "description": "Round-the-clock assistance during your trip", "display_order": 10},
    ]
    
    for inc_data in inclusions_data:
        PackageInclusion.objects.create(package=package, **inc_data)
    
    # Add package exclusions
    exclusions_data = [
        {"title": "Personal Expenses", "description": "Shopping, laundry, phone calls, etc.", "display_order": 1},
        {"title": "Extra Meals", "description": "Meals not mentioned in inclusions", "display_order": 2},
        {"title": "Travel Insurance", "description": "Optional travel insurance coverage", "display_order": 3},
        {"title": "Excess Baggage", "description": "Additional baggage beyond airline allowance", "display_order": 4},
        {"title": "Optional Tours", "description": "Any tours not mentioned in itinerary", "display_order": 5},
    ]
    
    for exc_data in exclusions_data:
        PackageExclusion.objects.create(package=package, **exc_data)
    
    packages_created += 1
    print(f"   ✅ Package created successfully! (ID: {package.id}, Code: {package.package_code})")

print(f"\n{'='*80}")
print(f"✅ PACKAGE CREATION COMPLETED!")
print("="*80)

print(f"\n📊 Summary:")
print(f"   - Packages Created: {packages_created}/10")
print(f"   - Organization: {org.name} (ID: {org.id})")
print(f"   - Status: All Active")
print(f"   - Visibility: Public (reselling allowed)")

if packages_created > 0:
    print(f"\n✨ Package Details:")
    for idx, pkg in enumerate(UmrahPackage.objects.filter(organization=org).order_by('id'), 1):
        print(f"   {idx}. {pkg.title}")
        print(f"      - Code: {pkg.package_code}")
        print(f"      - Capacity: {pkg.max_capacity} seats")
        print(f"      - Hotels: {pkg.hotel_details.count()}")
        print(f"      - Tickets: {pkg.ticket_details.count()}")
        print(f"      - Transport: {pkg.transport_details.count()}")
        print(f"      - Inclusions: {pkg.inclusions.count()}")
        print(f"      - Exclusions: {pkg.exclusions.count()}")

print(f"\n{'='*80}")
print("🎉 All packages are ready to use in the admin panel!")
print("="*80)
