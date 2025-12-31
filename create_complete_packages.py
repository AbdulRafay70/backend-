"""
Comprehensive script to create Umrah packages with ALL details:
- Hotels (Makkah & Madinah) with pricing for all bed types
- Flights/Tickets
- Transport details
- Food, Ziyarat options
- Visa pricing (Adult, Child, Infant)
- Service charges
- Partial payments
- Discounts
- Room type activation
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from tickets.models import Ticket, Hotels
from organization.models import Organization
from django.utils import timezone

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("CREATING COMPREHENSIVE UMRAH PACKAGES")
print("="*80)

# Delete all existing packages
deleted_count = UmrahPackage.objects.filter(organization=org).count()
UmrahPackage.objects.filter(organization=org).delete()
print(f"\n✓ Deleted {deleted_count} existing packages")

# Get resources
makkah_hotels = list(Hotels.objects.filter(organization=org, city__name='Makkah').order_by('id'))
madinah_hotels = list(Hotels.objects.filter(organization=org, city__name='Madinah').order_by('id'))
tickets = list(Ticket.objects.filter(organization=org).order_by('id'))

print(f"\nResources available:")
print(f"  Makkah hotels: {len(makkah_hotels)}")
print(f"  Madinah hotels: {len(madinah_hotels)}")
print(f"  Tickets: {len(tickets)}")

# Package configurations
packages_config = [
    {
        'title': '3 Star Economy Umrah Package',
        'rules': 'Standard terms and conditions apply. Cancellation 15 days before departure.',
        'total_seats': 50,
        'makkah_hotel_idx': 0,
        'madinah_hotel_idx': 0,
        'ticket_idx': 0,
        'makkah_nights': 7,
        'madinah_nights': 7,
        # Hotel 1 pricing (per night)
        'hotel1_sharing_sell': 8000, 'hotel1_sharing_purchase': 6400,
        'hotel1_quint_sell': 7000, 'hotel1_quint_purchase': 5600,
        'hotel1_quad_sell': 6500, 'hotel1_quad_purchase': 5200,
        'hotel1_triple_sell': 6000, 'hotel1_triple_purchase': 4800,
        'hotel1_double_sell': 5500, 'hotel1_double_purchase': 4400,
    },
    {
        'title': '4 Star Standard Umrah Package',
        'rules': 'Premium package with excellent services. Free cancellation 30 days before.',
        'total_seats': 40,
        'makkah_hotel_idx': 1,
        'madinah_hotel_idx': 1,
        'ticket_idx': 1,
        'makkah_nights': 10,
        'madinah_nights': 11,
        'hotel1_sharing_sell': 12000, 'hotel1_sharing_purchase': 9600,
        'hotel1_quint_sell': 10500, 'hotel1_quint_purchase': 8400,
        'hotel1_quad_sell': 9500, 'hotel1_quad_purchase': 7600,
        'hotel1_triple_sell': 8500, 'hotel1_triple_purchase': 6800,
        'hotel1_double_sell': 7500, 'hotel1_double_purchase': 6000,
    },
    {
        'title': '5 Star Premium Umrah Package',
        'rules': 'Luxury package with VIP services. Flexible cancellation policy.',
        'total_seats': 30,
        'makkah_hotel_idx': 2,
        'madinah_hotel_idx': 0,
        'ticket_idx': 2,
        'makkah_nights': 10,
        'madinah_nights': 11,
        'hotel1_sharing_sell': 15000, 'hotel1_sharing_purchase': 12000,
        'hotel1_quint_sell': 13000, 'hotel1_quint_purchase': 10400,
        'hotel1_quad_sell': 12000, 'hotel1_quad_purchase': 9600,
        'hotel1_triple_sell': 11000, 'hotel1_triple_purchase': 8800,
        'hotel1_double_sell': 10000, 'hotel1_double_purchase': 8000,
    },
    {
        'title': '5 Star VIP Umrah Package',
        'rules': 'Ultimate luxury experience. Full refund 45 days before departure.',
        'total_seats': 20,
        'makkah_hotel_idx': 1,
        'madinah_hotel_idx': 1,
        'ticket_idx': 3,
        'makkah_nights': 14,
        'madinah_nights': 14,
        'hotel1_sharing_sell': 18000, 'hotel1_sharing_purchase': 14400,
        'hotel1_quint_sell': 16000, 'hotel1_quint_purchase': 12800,
        'hotel1_quad_sell': 14500, 'hotel1_quad_purchase': 11600,
        'hotel1_triple_sell': 13000, 'hotel1_triple_purchase': 10400,
        'hotel1_double_sell': 11500, 'hotel1_double_purchase': 9200,
    },
    {
        'title': 'Family Umrah Package',
        'rules': 'Perfect for families. Kids under 2 travel free.',
        'total_seats': 60,
        'makkah_hotel_idx': 0,
        'madinah_hotel_idx': 1,
        'ticket_idx': 4,
        'makkah_nights': 10,
        'madinah_nights': 11,
        'hotel1_sharing_sell': 10000, 'hotel1_sharing_purchase': 8000,
        'hotel1_quint_sell': 9000, 'hotel1_quint_purchase': 7200,
        'hotel1_quad_sell': 8000, 'hotel1_quad_purchase': 6400,
        'hotel1_triple_sell': 7000, 'hotel1_triple_purchase': 5600,
        'hotel1_double_sell': 6000, 'hotel1_double_purchase': 4800,
    },
]

created_packages = []

for idx, config in enumerate(packages_config):
    if config['ticket_idx'] >= len(tickets):
        print(f"\nSkipping {config['title']} - no ticket available")
        continue
    
    if config['makkah_hotel_idx'] >= len(makkah_hotels) or config['madinah_hotel_idx'] >= len(madinah_hotels):
        print(f"\nSkipping {config['title']} - hotels not available")
        continue
    
    print(f"\n{'='*80}")
    print(f"Creating: {config['title']}")
    print(f"{'='*80}")
    
    # Get resources for this package
    makkah_hotel = makkah_hotels[config['makkah_hotel_idx']]
    madinah_hotel = madinah_hotels[config['madinah_hotel_idx']]
    ticket = tickets[config['ticket_idx']]
    
    # Create package with ALL details
    package = UmrahPackage.objects.create(
        organization=org,
        title=config['title'],
        description=f"Complete Umrah package with {config['makkah_nights']} nights in Makkah and {config['madinah_nights']} nights in Madinah",
        rules=config['rules'],
        package_type='umrah',
        status='active',
        
        # Dates
        start_date=timezone.now().date(),
        end_date=(timezone.now() + timedelta(days=365)).date(),
        
        # Capacity
        max_capacity=config['total_seats'],
        total_seats=config['total_seats'],
        left_seats=config['total_seats'],
        booked_seats=0,
        confirmed_seats=0,
        
        # Base price
        price_per_person=150000 + (idx * 50000),
        
        # Hotels
        makkah_hotel=makkah_hotel,
        madina_hotel=madinah_hotel,
        makkah_nights=config['makkah_nights'],
        madina_nights=config['madinah_nights'],
        
        # Hotel 1 (Makkah) Pricing - Selling & Purchase for all bed types
        makkah_hotel_sharing_selling_price=config['hotel1_sharing_sell'],
        makkah_hotel_sharing_purchase_price=config['hotel1_sharing_purchase'],
        makkah_hotel_quint_selling_price=config['hotel1_quint_sell'],
        makkah_hotel_quint_purchase_price=config['hotel1_quint_purchase'],
        makkah_hotel_quad_selling_price=config['hotel1_quad_sell'],
        makkah_hotel_quad_purchase_price=config['hotel1_quad_purchase'],
        makkah_hotel_triple_selling_price=config['hotel1_triple_sell'],
        makkah_hotel_triple_purchase_price=config['hotel1_triple_purchase'],
        makkah_hotel_double_selling_price=config['hotel1_double_sell'],
        makkah_hotel_double_purchase_price=config['hotel1_double_purchase'],
        
        # Hotel 2 (Madinah) Pricing - slightly cheaper
        madina_hotel_sharing_selling_price=config['hotel1_sharing_sell'] - 1000,
        madina_hotel_sharing_purchase_price=config['hotel1_sharing_purchase'] - 800,
        madina_hotel_quint_selling_price=config['hotel1_quint_sell'] - 1000,
        madina_hotel_quint_purchase_price=config['hotel1_quint_purchase'] - 800,
        madina_hotel_quad_selling_price=config['hotel1_quad_sell'] - 1000,
        madina_hotel_quad_purchase_price=config['hotel1_quad_purchase'] - 800,
        madina_hotel_triple_selling_price=config['hotel1_triple_sell'] - 1000,
        madina_hotel_triple_purchase_price=config['hotel1_triple_purchase'] - 800,
        madina_hotel_double_selling_price=config['hotel1_double_sell'] - 1000,
        madina_hotel_double_purchase_price=config['hotel1_double_purchase'] - 800,
        
        # Flight
        ticket=ticket,
        
        # Transport
        transport_selling_price=20000,
        transport_purchase_price=15000,
        
        # Food
        food_selling_price=1500,
        food_purchase_price=1000,
        
        # Ziyarat
        makkah_ziyarat_selling_price=15000,
        makkah_ziyarat_purchase_price=12000,
        madinah_ziyarat_selling_price=12000,
        madinah_ziyarat_purchase_price=10000,
        
        # Visa Pricing
        adault_visa_selling_price=25000,
        adault_visa_purchase_price=20000,
        child_visa_selling_price=15000,
        child_visa_purchase_price=12000,
        infant_visa_selling_price=5000,
        infant_visa_purchase_price=4000,
        
        # Room Types Activation
        is_active=True,
        is_quaint_active=True,
        is_sharing_active=True,
        is_quad_active=True,
        is_triple_active=True,
        is_double_active=True,
        
        # Service Charges
        adault_service_charge=2000,
        child_service_charge=1000,
        infant_service_charge=500,
        is_service_charge_active=True,
        
        # Partial Payments
        adault_partial_payment=50000,
        child_partial_payment=30000,
        infant_partial_payment=10000,
        is_partial_payment_active=True,
        min_partial_percent=30,
        
        # Flight Conditions
        adult_from=0,
        adult_to=100,
        max_child=10,
        max_infant=5,
        
        # Reselling
        reselling_allowed=True,
        inventory_owner_organization_id=org.id,
    )
    
    package.save()
    
    print(f"✓ Package Code: {package.package_code}")
    print(f"✓ Makkah Hotel: {makkah_hotel.name} ({config['makkah_nights']} nights)")
    print(f"✓ Madinah Hotel: {madinah_hotel.name} ({config['madinah_nights']} nights)")
    print(f"✓ Flight: {ticket.ticket_number} ({ticket.airline.name if ticket.airline else 'N/A'})")
    print(f"✓ Total Seats: {config['total_seats']}")
    print(f"✓ Hotel Pricing: Double {config['hotel1_double_sell']}, Triple {config['hotel1_triple_sell']}, Quad {config['hotel1_quad_sell']}")
    
    created_packages.append(package)

print("\n" + "="*80)
print(f"✅ SUCCESSFULLY CREATED {len(created_packages)} COMPREHENSIVE PACKAGES!")
print("="*80)

# Final summary
print("\n📋 PACKAGE SUMMARY:")
for pkg in created_packages:
    print(f"\n{pkg.title} ({pkg.package_code}):")
    print(f"  🏨 Makkah: {pkg.makkah_hotel.name if pkg.makkah_hotel else 'N/A'}")
    print(f"  🏨 Madinah: {pkg.madina_hotel.name if pkg.madina_hotel else 'N/A'}")
    print(f"  ✈️  Flight: {pkg.ticket.ticket_number if pkg.ticket else 'N/A'}")
    print(f"  💺 Seats: {pkg.total_seats}")
    print(f"  💰 Base Price: {pkg.price_per_person:,} PKR")
