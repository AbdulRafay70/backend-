"""
Final verification that all packages have complete pricing data.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

print("=" * 80)
print("FINAL VERIFICATION - PACKAGE PRICING DATA")
print("=" * 80)

packages = UmrahPackage.objects.all()
all_good = True

for pkg in packages:
    print(f"\n📦 {pkg.title}")
    
    # Check food pricing
    if pkg.food_price_id:
        if pkg.food_selling_price > 0 and pkg.food_purchase_price > 0:
            print(f"   ✅ Food: Selling SAR {pkg.food_selling_price}, Purchase SAR {pkg.food_purchase_price}")
        else:
            print(f"   ❌ Food: Missing prices (Selling: {pkg.food_selling_price}, Purchase: {pkg.food_purchase_price})")
            all_good = False
    else:
        print(f"   ℹ️  Food: Not configured")
    
    # Check Makkah ziyarat pricing
    if pkg.makkah_ziyarat_id:
        if pkg.makkah_ziyarat_selling_price > 0 and pkg.makkah_ziyarat_purchase_price > 0:
            print(f"   ✅ Makkah Ziyarat: Selling SAR {pkg.makkah_ziyarat_selling_price}, Purchase SAR {pkg.makkah_ziyarat_purchase_price}")
        else:
            print(f"   ❌ Makkah Ziyarat: Missing prices (Selling: {pkg.makkah_ziyarat_selling_price}, Purchase: {pkg.makkah_ziyarat_purchase_price})")
            all_good = False
    else:
        print(f"   ℹ️  Makkah Ziyarat: Not configured")
    
    # Check Madinah ziyarat pricing
    if pkg.madinah_ziyarat_id:
        if pkg.madinah_ziyarat_selling_price > 0 and pkg.madinah_ziyarat_purchase_price > 0:
            print(f"   ✅ Madinah Ziyarat: Selling SAR {pkg.madinah_ziyarat_selling_price}, Purchase SAR {pkg.madinah_ziyarat_purchase_price}")
        else:
            print(f"   ❌ Madinah Ziyarat: Missing prices (Selling: {pkg.madinah_ziyarat_selling_price}, Purchase: {pkg.madinah_ziyarat_purchase_price})")
            all_good = False
    else:
        print(f"   ℹ️  Madinah Ziyarat: Not configured")

print("\n" + "=" * 80)
if all_good:
    print("✅ VERIFICATION PASSED - ALL PACKAGES HAVE COMPLETE PRICING!")
else:
    print("❌ VERIFICATION FAILED - SOME PACKAGES HAVE MISSING PRICES!")
print("=" * 80)

# Summary statistics
print("\n📊 PRICING SUMMARY:")
total = packages.count()
with_food_prices = UmrahPackage.objects.filter(
    food_price_id__isnull=False,
    food_selling_price__gt=0,
    food_purchase_price__gt=0
).count()
with_makkah_prices = UmrahPackage.objects.filter(
    makkah_ziyarat_id__isnull=False,
    makkah_ziyarat_selling_price__gt=0,
    makkah_ziyarat_purchase_price__gt=0
).count()
with_madinah_prices = UmrahPackage.objects.filter(
    madinah_ziyarat_id__isnull=False,
    madinah_ziyarat_selling_price__gt=0,
    madinah_ziyarat_purchase_price__gt=0
).count()

print(f"Total Packages: {total}")
print(f"Packages with complete food pricing: {with_food_prices}/{total}")
print(f"Packages with complete Makkah ziyarat pricing: {with_makkah_prices}/{total}")
print(f"Packages with complete Madinah ziyarat pricing: {with_madinah_prices}/{total}")
print("=" * 80)
