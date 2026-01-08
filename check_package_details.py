"""
Check all packages in the database for proper food and ziyarat details.
Verify that Makkah/Madinah ziyarat selections are correctly set.
"""
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage, FoodPrice, ZiaratPrice
from organization.models import Organization

print("=" * 100)
print("CHECKING ALL PACKAGES FOR FOOD AND ZIYARAT DETAILS")
print("=" * 100)

# Get all organizations
orgs = Organization.objects.all()

for org in orgs:
    packages = UmrahPackage.objects.filter(organization=org)
    
    if packages.count() == 0:
        continue
    
    print(f"\n{'=' * 100}")
    print(f"ORGANIZATION: {org.name} (ID: {org.id})")
    print(f"Total Packages: {packages.count()}")
    print(f"{'=' * 100}")
    
    for pkg in packages:
        print(f"\n📦 Package: {pkg.title}")
        print(f"   Code: {pkg.package_code}")
        print(f"   Status: {pkg.status}")
        print(f"   Type: {pkg.package_type}")
        
        # Check Food Details
        print(f"\n   🍽️  FOOD DETAILS:")
        print(f"      Food Selling Price: {pkg.food_selling_price} SAR")
        print(f"      Food Purchase Price: {pkg.food_purchase_price} SAR")
        print(f"      Food Price ID: {pkg.food_price_id}")
        
        if pkg.food_price_id:
            try:
                food = FoodPrice.objects.get(id=pkg.food_price_id)
                print(f"      ✅ Food Item Found: {food.title}")
                print(f"         City: {food.city.name if food.city else 'N/A'}")
                print(f"         Description: {food.description or 'N/A'}")
                print(f"         Adult Selling: {food.adult_selling_price}")
                print(f"         Child Selling: {food.child_selling_price}")
                print(f"         Infant Selling: {food.infant_selling_price}")
            except FoodPrice.DoesNotExist:
                print(f"      ❌ ERROR: Food Price ID {pkg.food_price_id} does not exist!")
        else:
            if pkg.food_selling_price > 0 or pkg.food_purchase_price > 0:
                print(f"      ⚠️  WARNING: Food prices set but no Food Price ID!")
            else:
                print(f"      ℹ️  No food included in package")
        
        # Check Makkah Ziyarat Details
        print(f"\n   🕋 MAKKAH ZIYARAT DETAILS:")
        print(f"      Makkah Ziyarat Selling Price: {pkg.makkah_ziyarat_selling_price} SAR")
        print(f"      Makkah Ziyarat Purchase Price: {pkg.makkah_ziyarat_purchase_price} SAR")
        print(f"      Makkah Ziyarat ID: {pkg.makkah_ziyarat_id}")
        
        if pkg.makkah_ziyarat_id:
            try:
                ziyarat = ZiaratPrice.objects.get(id=pkg.makkah_ziyarat_id)
                print(f"      ✅ Ziyarat Found: {ziyarat.ziarat_title}")
                print(f"         City: {ziyarat.city.name if ziyarat.city else 'N/A'}")
                
                # Check if city is Makkah
                if ziyarat.city and ziyarat.city.name.lower() not in ['makkah', 'mecca', 'makkah al mukarramah']:
                    print(f"      ❌ ERROR: Makkah Ziyarat ID points to {ziyarat.city.name} (should be Makkah)!")
                else:
                    print(f"      ✅ City correctly set to Makkah")
                
                print(f"         Description: {ziyarat.description or 'N/A'}")
                print(f"         Contact: {ziyarat.contact_person} - {ziyarat.contact_number}")
                print(f"         Adult Selling: {ziyarat.adult_selling_price}")
                print(f"         Child Selling: {ziyarat.child_selling_price}")
                print(f"         Status: {ziyarat.status}")
            except ZiaratPrice.DoesNotExist:
                print(f"      ❌ ERROR: Makkah Ziyarat ID {pkg.makkah_ziyarat_id} does not exist!")
        else:
            if pkg.makkah_ziyarat_selling_price > 0 or pkg.makkah_ziyarat_purchase_price > 0:
                print(f"      ⚠️  WARNING: Makkah ziyarat prices set but no Ziyarat ID!")
            else:
                print(f"      ℹ️  No Makkah ziyarat included in package")
        
        # Check Madinah Ziyarat Details
        print(f"\n   🕌 MADINAH ZIYARAT DETAILS:")
        print(f"      Madinah Ziyarat Selling Price: {pkg.madinah_ziyarat_selling_price} SAR")
        print(f"      Madinah Ziyarat Purchase Price: {pkg.madinah_ziyarat_purchase_price} SAR")  
        print(f"      Madinah Ziyarat ID: {pkg.madinah_ziyarat_id}")
        
        if pkg.madinah_ziyarat_id:
            try:
                ziyarat = ZiaratPrice.objects.get(id=pkg.madinah_ziyarat_id)
                print(f"      ✅ Ziyarat Found: {ziyarat.ziarat_title}")
                print(f"         City: {ziyarat.city.name if ziyarat.city else 'N/A'}")
                
                # Check if city is Madinah
                if ziyarat.city and ziyarat.city.name.lower() not in ['madinah', 'medina', 'al madinah', 'madinah al munawwarah']:
                    print(f"      ❌ ERROR: Madinah Ziyarat ID points to {ziyarat.city.name} (should be Madinah)!")
                else:
                    print(f"      ✅ City correctly set to Madinah")
                
                print(f"         Description: {ziyarat.description or 'N/A'}")
                print(f"         Contact: {ziyarat.contact_person} - {ziyarat.contact_number}")
                print(f"         Adult Selling: {ziyarat.adult_selling_price}")
                print(f"         Child Selling: {ziyarat.child_selling_price}")
                print(f"         Status: {ziyarat.status}")
            except ZiaratPrice.DoesNotExist:
                print(f"      ❌ ERROR: Madinah Ziyarat ID {pkg.madinah_ziyarat_id} does not exist!")
        else:
            if pkg.madinah_ziyarat_selling_price > 0 or pkg.madinah_ziyarat_purchase_price > 0:
                print(f"      ⚠️  WARNING: Madinah ziyarat prices set but no Ziyarat ID!")
            else:
                print(f"      ℹ️  No Madinah ziyarat included in package")
        
        # Summary for this package
        print(f"\n   📊 PACKAGE SUMMARY:")
        has_food = pkg.food_price_id is not None
        has_makkah = pkg.makkah_ziyarat_id is not None
        has_madinah = pkg.madinah_ziyarat_id is not None
        
        print(f"      Food: {'✅ Configured' if has_food else '❌ Not configured'}")
        print(f"      Makkah Ziyarat: {'✅ Configured' if has_makkah else '❌ Not configured'}")
        print(f"      Madinah Ziyarat: {'✅ Configured' if has_madinah else '❌ Not configured'}")
        
        print(f"\n   {'-' * 90}")

print(f"\n{'=' * 100}")
print("✅ PACKAGE CHECK COMPLETE!")
print("=" * 100)

# Summary statistics
print(f"\n📊 OVERALL STATISTICS:")
total_packages = UmrahPackage.objects.all().count()
packages_with_food = UmrahPackage.objects.filter(food_price_id__isnull=False).count()
packages_with_makkah = UmrahPackage.objects.filter(makkah_ziyarat_id__isnull=False).count()
packages_with_madinah = UmrahPackage.objects.filter(madinah_ziyarat_id__isnull=False).count()

print(f"Total Packages: {total_packages}")
print(f"Packages with Food: {packages_with_food} ({(packages_with_food/total_packages*100) if total_packages > 0 else 0:.1f}%)")
print(f"Packages with Makkah Ziyarat: {packages_with_makkah} ({(packages_with_makkah/total_packages*100) if total_packages > 0 else 0:.1f}%)")
print(f"Packages with Madinah Ziyarat: {packages_with_madinah} ({(packages_with_madinah/total_packages*100) if total_packages > 0 else 0:.1f}%)")

# Check for orphaned references
print(f"\n🔍 CHECKING FOR DATA INTEGRITY ISSUES:")

# Check for invalid food price IDs
invalid_food_refs = []
for pkg in UmrahPackage.objects.filter(food_price_id__isnull=False):
    if not FoodPrice.objects.filter(id=pkg.food_price_id).exists():
        invalid_food_refs.append((pkg.package_code, pkg.food_price_id))

if invalid_food_refs:
    print(f"❌ Found {len(invalid_food_refs)} packages with invalid food price IDs:")
    for code, food_id in invalid_food_refs:
        print(f"   - {code}: Food ID {food_id} does not exist")
else:
    print(f"✅ All food price references are valid")

# Check for invalid Makkah ziyarat IDs
invalid_makkah_refs = []
for pkg in UmrahPackage.objects.filter(makkah_ziyarat_id__isnull=False):
    if not ZiaratPrice.objects.filter(id=pkg.makkah_ziyarat_id).exists():
        invalid_makkah_refs.append((pkg.package_code, pkg.makkah_ziyarat_id))

if invalid_makkah_refs:
    print(f"❌ Found {len(invalid_makkah_refs)} packages with invalid Makkah ziyarat IDs:")
    for code, ziyarat_id in invalid_makkah_refs:
        print(f"   - {code}: Makkah Ziyarat ID {ziyarat_id} does not exist")
else:
    print(f"✅ All Makkah ziyarat references are valid")

# Check for invalid Madinah ziyarat IDs
invalid_madinah_refs = []
for pkg in UmrahPackage.objects.filter(madinah_ziyarat_id__isnull=False):
    if not ZiaratPrice.objects.filter(id=pkg.madinah_ziyarat_id).exists():
        invalid_madinah_refs.append((pkg.package_code, pkg.madinah_ziyarat_id))

if invalid_madinah_refs:
    print(f"❌ Found {len(invalid_madinah_refs)} packages with invalid Madinah ziyarat IDs:")
    for code, ziyarat_id in invalid_madinah_refs:
        print(f"   - {code}: Madinah Ziyarat ID {ziyarat_id} does not exist")
else:
    print(f"✅ All Madinah ziyarat references are valid")

# Check for wrong city assignments
print(f"\n🌍 CHECKING CITY ASSIGNMENTS:")
wrong_makkah_city = []
for pkg in UmrahPackage.objects.filter(makkah_ziyarat_id__isnull=False):
    try:
        ziyarat = ZiaratPrice.objects.get(id=pkg.makkah_ziyarat_id)
        if ziyarat.city and ziyarat.city.name.lower() not in ['makkah', 'mecca', 'makkah al mukarramah']:
            wrong_makkah_city.append((pkg.package_code, ziyarat.city.name))
    except ZiaratPrice.DoesNotExist:
        pass

if wrong_makkah_city:
    print(f"❌ Found {len(wrong_makkah_city)} packages with Makkah ziyarat pointing to wrong city:")
    for code, city in wrong_makkah_city:
        print(f"   - {code}: Points to {city} instead of Makkah")
else:
    print(f"✅ All Makkah ziyarat references point to Makkah city")

wrong_madinah_city = []
for pkg in UmrahPackage.objects.filter(madinah_ziyarat_id__isnull=False):
    try:
        ziyarat = ZiaratPrice.objects.get(id=pkg.madinah_ziyarat_id)
        if ziyarat.city and ziyarat.city.name.lower() not in ['madinah', 'medina', 'al madinah', 'madinah al munawwarah']:
            wrong_madinah_city.append((pkg.package_code, ziyarat.city.name))
    except ZiaratPrice.DoesNotExist:
        pass

if wrong_madinah_city:
    print(f"❌ Found {len(wrong_madinah_city)} packages with Madinah ziyarat pointing to wrong city:")
    for code, city in wrong_madinah_city:
        print(f"   - {code}: Points to {city} instead of Madinah")
else:
    print(f"✅ All Madinah ziyarat references point to Madinah city")

print(f"\n{'=' * 100}")
print("🎉 CHECK COMPLETE!")
print("=" * 100)
