"""
Fix package ziyarat issues.
This script will:
1. Fix the Diamond Elite package's Madinah ziyarat to point to a valid Madinah option
2. Optionally add Madinah ziyarat to packages that don't have it
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage, ZiaratPrice

print("=" * 80)
print("FIXING PACKAGE ZIYARAT ISSUES")
print("=" * 80)

# Fix the Diamond Elite package
print("\n1. Fixing Diamond Elite Package...")
try:
    pkg = UmrahPackage.objects.get(package_code='PKG-20260103-DE86')
    print(f"   Found package: {pkg.title}")
    
    # Get a valid Madinah ziyarat (using ID 20 - Madinah Ziyarat - Full Day)
    madinah_ziyarat = ZiaratPrice.objects.get(id=20)
    print(f"   Setting Madinah ziyarat to: {madinah_ziyarat.ziarat_title}")
    
    pkg.madinah_ziyarat_id = 20
    pkg.madinah_ziyarat_selling_price = madinah_ziyarat.adult_selling_price
    pkg.madinah_ziyarat_purchase_price = madinah_ziyarat.adult_purchase_price
    pkg.save()
    
    print(f"   ✅ Fixed! Madinah ziyarat now points to ID 20 (Madinah)")
except UmrahPackage.DoesNotExist:
    print(f"   ❌ Package not found")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Optionally add Madinah ziyarat to other packages
print("\n2. Adding Madinah ziyarat to packages without it...")
packages_without_madinah = UmrahPackage.objects.filter(madinah_ziyarat_id__isnull=True)

print(f"   Found {packages_without_madinah.count()} packages without Madinah ziyarat")

# Get Madinah ziyarat options
madinah_half_day = ZiaratPrice.objects.get(id=21)  # Madinah Ziyarat - Half Day
madinah_full_day = ZiaratPrice.objects.get(id=20)  # Madinah Ziyarat - Full Day

for pkg in packages_without_madinah:
    # Use half day for shorter packages (< 15 days), full day for longer ones
    # We'll estimate based on package title
    if '7 Days' in pkg.title or '14 Days' in pkg.title:
        ziyarat = madinah_half_day
    else:
        ziyarat = madinah_full_day
    
    pkg.madinah_ziyarat_id = ziyarat.id
    pkg.madinah_ziyarat_selling_price = ziyarat.adult_selling_price
    pkg.madinah_ziyarat_purchase_price = ziyarat.adult_purchase_price
    pkg.save()
    
    print(f"   ✅ Added {ziyarat.ziarat_title} to: {pkg.title}")

print("\n" + "=" * 80)
print("✅ ALL FIXES COMPLETE!")
print("=" * 80)

# Verify the fixes
print("\nVerifying fixes...")
from check_packages_simple import *
