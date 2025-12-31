"""
Simple script to create Umrah packages with basic details.
The UmrahPackage model has direct fields instead of separate detail models.
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from organization.models import Organization
from django.utils import timezone

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("CREATING UMRAH PACKAGES")
print("="*80)

# Delete existing packages to start fresh
deleted_count = UmrahPackage.objects.filter(organization=org).count()
UmrahPackage.objects.filter(organization=org).delete()
print(f"\nDeleted {deleted_count} existing packages")

# Package configurations
packages_config = [
    {
        'title': 'Economy Umrah Package - 14 Days',
        'description': 'Affordable Umrah package with comfortable 4-star hotels in Makkah and Madinah',
        'price_per_person': 150000,
        'max_capacity': 50,
    },
    {
        'title': 'Standard Umrah Package - 21 Days',
        'description': 'Well-balanced package with excellent 5-star accommodations near Haram',
        'price_per_person': 250000,
        'max_capacity': 40,
    },
    {
        'title': 'Premium Umrah Package - 21 Days',
        'description': 'Luxury package with premium hotels within walking distance of Haram',
        'price_per_person': 350000,
        'max_capacity': 30,
    },
    {
        'title': 'VIP Umrah Package - 28 Days',
        'description': 'Ultimate luxury experience with 5-star hotels and exclusive services',
        'price_per_person': 450000,
        'max_capacity': 20,
    },
    {
        'title': 'Family Umrah Package - 21 Days',
        'description': 'Perfect for families with spacious accommodations and family-friendly services',
        'price_per_person': 200000,
        'max_capacity': 60,
    },
    {
        'title': 'Ramadan Special Package - 15 Days',
        'description': 'Special Ramadan package with premium hotels and Iftar arrangements',
        'price_per_person': 300000,
        'max_capacity': 35,
    },
]

created_packages = []

for idx, config in enumerate(packages_config):
    print(f"\nCreating: {config['title']}")
    
    # Create package
    package = UmrahPackage.objects.create(
        organization=org,
        title=config['title'],
        description=config['description'],
        package_type='umrah',
        status='active',
        start_date=timezone.now().date(),
        end_date=(timezone.now() + timedelta(days=365)).date(),
        max_capacity=config['max_capacity'],
        total_seats=config['max_capacity'],
        left_seats=config['max_capacity'],
        booked_seats=0,
        confirmed_seats=0,
        price_per_person=config['price_per_person'],
        is_active=True,
        is_quaint_active=True,
        is_sharing_active=True,
        is_quad_active=True,
        is_triple_active=True,
        is_double_active=True,
        # Visa prices
        adault_visa_selling_price=25000,
        adault_visa_purchase_price=20000,
        child_visa_selling_price=15000,
        child_visa_purchase_price=12000,
        infant_visa_selling_price=5000,
        infant_visa_purchase_price=4000,
        # Food prices
        food_selling_price=1500,
        food_purchase_price=1000,
        # Ziyarat prices
        makkah_ziyarat_selling_price=15000,
        makkah_ziyarat_purchase_price=12000,
        madinah_ziyarat_selling_price=12000,
        madinah_ziyarat_purchase_price=10000,
        # Transport prices
        transport_selling_price=20000,
        transport_purchase_price=15000,
    )
    
    print(f"  ✓ Created package: {package.title}")
    print(f"    Price: {package.price_per_person:,} PKR")
    print(f"    Capacity: {package.max_capacity} seats")
    
    created_packages.append(package)

print("\n" + "="*80)
print(f"✅ Created {len(created_packages)} Umrah packages!")
print("="*80)

# Summary
print("\nPackage Summary:")
for pkg in created_packages:
    print(f"\n{pkg.title}:")
    print(f"  Package Code: {pkg.package_code}")
    print(f"  Price: {pkg.price_per_person:,} PKR")
    print(f"  Capacity: {pkg.max_capacity} seats")
    print(f"  Status: {pkg.status}")
    print(f"  Active: {pkg.is_active}")

print("\n" + "="*80)
print("NOTE: Hotels need to be assigned separately through the admin interface")
print("or by updating the package records with hotel relationships.")
print("="*80)
