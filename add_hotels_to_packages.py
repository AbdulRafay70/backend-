"""
Script to add hotel details to existing Umrah packages.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from tickets.models import Hotels
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("ADDING HOTEL DETAILS TO PACKAGES")
print("="*80)

# Get all packages
packages = UmrahPackage.objects.filter(organization=org).order_by('id')
print(f"\nFound {packages.count()} packages")

# Get hotels
makkah_hotels = list(Hotels.objects.filter(organization=org, city__name='Makkah').order_by('id'))
madinah_hotels = list(Hotels.objects.filter(organization=org, city__name='Madinah').order_by('id'))

print(f"Found {len(makkah_hotels)} Makkah hotels")
print(f"Found {len(madinah_hotels)} Madinah hotels")

if len(makkah_hotels) == 0 or len(madinah_hotels) == 0:
    print("\n❌ Not enough hotels found!")
    exit(1)

# Assign hotels to packages
updated_count = 0
for idx, package in enumerate(packages):
    # Assign Makkah and Madinah hotels in round-robin fashion
    makkah_hotel = makkah_hotels[idx % len(makkah_hotels)]
    madinah_hotel = madinah_hotels[idx % len(madinah_hotels)]
    
    # Update package with hotels
    package.makkah_hotel = makkah_hotel
    package.madina_hotel = madinah_hotel
    package.save()
    
    print(f"\n✓ {package.title}")
    print(f"  Makkah: {makkah_hotel.name}")
    print(f"  Madinah: {madinah_hotel.name}")
    
    updated_count += 1

print("\n" + "="*80)
print(f"✅ Updated {updated_count} packages with hotel details!")
print("="*80)
