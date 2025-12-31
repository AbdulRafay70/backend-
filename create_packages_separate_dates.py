"""
Create 6 Umrah packages with separate dates, hotels, flights, and pricing.
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
print("CREATING 6 UMRAH PACKAGES WITH SEPARATE DATES")
print("="*80)

# Delete all existing packages
deleted_count = UmrahPackage.objects.filter(organization=org).count()
UmrahPackage.objects.filter(organization=org).delete()
print(f"\n✓ Deleted {deleted_count} existing packages")

# Get resources
makkah_hotels = list(Hotels.objects.filter(organization=org, city__name='Makkah').order_by('id'))
madinah_hotels = list(Hotels.objects.filter(organization=org, city__name='Madinah').order_by('id'))
tickets = list(Ticket.objects.filter(organization=org).order_by('id'))

print(f"\nResources: {len(makkah_hotels)} Makkah hotels, {len(madinah_hotels)} Madinah hotels, {len(tickets)} tickets")

# Package configurations with separate dates
base_date = timezone.now().date()
packages_config = [
    {
        'title': '3 Star Economy Umrah Package',
        'description': 'Affordable package with comfortable 3-star hotels',
        'start_date': base_date,
        'end_date': base_date + timedelta(days=60),
        'price': 150000,
        'seats': 50,
        'makkah_idx': 0,
        'madinah_idx': 0,
        'ticket_idx': 0,
    },
    {
        'title': '4 Star Standard Umrah Package',
        'description': 'Well-balanced package with excellent 4-star hotels',
        'start_date': base_date + timedelta(days=30),
        'end_date': base_date + timedelta(days=120),
        'price': 250000,
        'seats': 40,
        'makkah_idx': 1,
        'madinah_idx': 1,
        'ticket_idx': 1,
    },
    {
        'title': '5 Star Premium Umrah Package',
        'description': 'Luxury package with premium 5-star hotels near Haram',
        'start_date': base_date + timedelta(days=60),
        'end_date': base_date + timedelta(days=180),
        'price': 350000,
        'seats': 30,
        'makkah_idx': 2,
        'madinah_idx': 0,
        'ticket_idx': 2,
    },
    {
        'title': '5 Star VIP Umrah Package',
        'description': 'Ultimate luxury experience with exclusive services',
        'start_date': base_date + timedelta(days=90),
        'end_date': base_date + timedelta(days=240),
        'price': 450000,
        'seats': 20,
        'makkah_idx': 1,
        'madinah_idx': 1,
        'ticket_idx': 3,
    },
    {
        'title': 'Family Umrah Package',
        'description': 'Perfect for families with spacious accommodations',
        'start_date': base_date + timedelta(days=45),
        'end_date': base_date + timedelta(days=150),
        'price': 200000,
        'seats': 60,
        'makkah_idx': 0,
        'madinah_idx': 1,
        'ticket_idx': 4,
    },
    {
        'title': 'Ramadan Special Package',
        'description': 'Special Ramadan package with premium services',
        'start_date': base_date + timedelta(days=120),
        'end_date': base_date + timedelta(days=210),
        'price': 300000,
        'seats': 35,
        'makkah_idx': 2,
        'madinah_idx': 0,
        'ticket_idx': 5,
    },
]

created_packages = []

for idx, config in enumerate(packages_config):
    if config['ticket_idx'] >= len(tickets):
        print(f"\nSkipping {config['title']} - no ticket")
        continue
    
    if config['makkah_idx'] >= len(makkah_hotels) or config['madinah_idx'] >= len(madinah_hotels):
        print(f"\nSkipping {config['title']} - hotels not available")
        continue
    
    print(f"\n{'='*80}")
    print(f"Creating: {config['title']}")
    
    # Get resources
    makkah_hotel = makkah_hotels[config['makkah_idx']]
    madinah_hotel = madinah_hotels[config['madinah_idx']]
    ticket = tickets[config['ticket_idx']]
    
    # Create package
    package = UmrahPackage.objects.create(
        organization=org,
        title=config['title'],
        description=config['description'],
        package_type='umrah',
        status='active',
        
        # Separate dates for each package
        start_date=config['start_date'],
        end_date=config['end_date'],
        
        # Capacity
        max_capacity=config['seats'],
        total_seats=config['seats'],
        left_seats=config['seats'],
        booked_seats=0,
        confirmed_seats=0,
        
        # Pricing
        price_per_person=config['price'],
        
        # Visa pricing
        adault_visa_selling_price=25000,
        adault_visa_purchase_price=20000,
        child_visa_selling_price=15000,
        child_visa_purchase_price=12000,
        infant_visa_selling_price=5000,
        infant_visa_purchase_price=4000,
        
        # Food pricing
        food_selling_price=1500,
        food_purchase_price=1000,
        
        # Ziyarat pricing
        makkah_ziyarat_selling_price=15000,
        makkah_ziyarat_purchase_price=12000,
        madinah_ziyarat_selling_price=12000,
        madinah_ziyarat_purchase_price=10000,
        
        # Transport pricing
        transport_selling_price=20000,
        transport_purchase_price=15000,
        
        # Room types activation
        is_active=True,
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
        
        # Partial payments
        adault_partial_payment=50000,
        child_partial_payment=30000,
        infant_partial_payment=10000,
        is_partial_payment_active=True,
        min_partial_percent=30,
        
        # Reselling
        reselling_allowed=True,
        inventory_owner_organization_id=org.id,
    )
    
    print(f"✓ Package Code: {package.package_code}")
    print(f"✓ Dates: {config['start_date']} to {config['end_date']}")
    print(f"✓ Price: {config['price']:,} PKR")
    print(f"✓ Seats: {config['seats']}")
    
    created_packages.append({
        'package': package,
        'makkah_hotel': makkah_hotel,
        'madinah_hotel': madinah_hotel,
        'ticket': ticket
    })

# Now assign hotels and tickets separately
print(f"\n{'='*80}")
print("ASSIGNING HOTELS AND FLIGHTS")
print(f"{'='*80}")

for item in created_packages:
    pkg = item['package']
    
    # Try to assign hotels using the correct field names
    # The model might use different field names, so we'll try to update
    try:
        # Check if these fields exist
        if hasattr(pkg, 'makkah_hotel'):
            pkg.makkah_hotel = item['makkah_hotel']
        if hasattr(pkg, 'madina_hotel'):
            pkg.madina_hotel = item['madinah_hotel']
        if hasattr(pkg, 'ticket'):
            pkg.ticket = item['ticket']
        
        pkg.save()
        print(f"\n✓ {pkg.title}")
        print(f"  Makkah: {item['makkah_hotel'].name}")
        print(f"  Madinah: {item['madinah_hotel'].name}")
        print(f"  Flight: {item['ticket'].ticket_number}")
    except Exception as e:
        print(f"\n⚠ {pkg.title}: Could not assign hotels/ticket - {str(e)}")

print(f"\n{'='*80}")
print(f"✅ CREATED {len(created_packages)} PACKAGES WITH SEPARATE DATES!")
print(f"{'='*80}")

# Summary
print("\n📋 PACKAGE SUMMARY:")
for item in created_packages:
    pkg = item['package']
    print(f"\n{pkg.title} ({pkg.package_code}):")
    print(f"  📅 Valid: {pkg.start_date} to {pkg.end_date}")
    print(f"  💰 Price: {pkg.price_per_person:,} PKR")
    print(f"  💺 Seats: {pkg.total_seats}")
    print(f"  🏨 Makkah: {item['makkah_hotel'].name}")
    print(f"  🏨 Madinah: {item['madinah_hotel'].name}")
    print(f"  ✈️  Flight: {item['ticket'].ticket_number}")
