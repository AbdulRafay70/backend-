"""
Simple check for packages food and ziyarat details.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage, FoodPrice, ZiaratPrice

print("Checking all packages...")
print("=" * 80)

packages = UmrahPackage.objects.all()
print(f"\nTotal packages in database: {packages.count()}\n")

issues_found = []

for pkg in packages:
    print(f"\nPackage: {pkg.title} ({pkg.package_code})")
    print(f"  Organization: {pkg.organization.name}")
    
    # Check Food
    if pkg.food_price_id:
        try:
            food = FoodPrice.objects.get(id=pkg.food_price_id)
            print(f"  Food: OK - {food.title} (City: {food.city.name if food.city else 'N/A'})")
        except FoodPrice.DoesNotExist:
            msg = f"  Food: ERROR - ID {pkg.food_price_id} does not exist!"
            print(msg)
            issues_found.append(f"{pkg.package_code}: {msg}")
    else:
        print(f"  Food: Not configured")
    
    # Check Makkah Ziyarat
    if pkg.makkah_ziyarat_id:
        try:
            ziyarat = ZiaratPrice.objects.get(id=pkg.makkah_ziyarat_id)
            city_name = ziyarat.city.name if ziyarat.city else 'N/A'
            
            # Check if city is correct
            if ziyarat.city and ziyarat.city.name.lower() not in ['makkah', 'mecca', 'makkah al mukarramah']:
                msg = f"  Makkah Ziyarat: ERROR - Points to {city_name} instead of Makkah!"
                print(msg)
                issues_found.append(f"{pkg.package_code}: {msg}")
            else:
                print(f"  Makkah Ziyarat: OK - {ziyarat.ziarat_title} (City: {city_name})")
        except ZiaratPrice.DoesNotExist:
            msg = f"  Makkah Ziyarat: ERROR - ID {pkg.makkah_ziyarat_id} does not exist!"
            print(msg)
            issues_found.append(f"{pkg.package_code}: {msg}")
    else:
        print(f"  Makkah Ziyarat: Not configured")
    
    # Check Madinah Ziyarat
    if pkg.madinah_ziyarat_id:
        try:
            ziyarat = ZiaratPrice.objects.get(id=pkg.madinah_ziyarat_id)
            city_name = ziyarat.city.name if ziyarat.city else 'N/A'
            
            # Check if city is correct
            if ziyarat.city and ziyarat.city.name.lower() not in ['madinah', 'medina', 'al madinah', 'madinah al munawwarah']:
                msg = f"  Madinah Ziyarat: ERROR - Points to {city_name} instead of Madinah!"
                print(msg)
                issues_found.append(f"{pkg.package_code}: {msg}")
            else:
                print(f"  Madinah Ziyarat: OK - {ziyarat.ziarat_title} (City: {city_name})")
        except ZiaratPrice.DoesNotExist:
            msg = f"  Madinah Ziyarat: ERROR - ID {pkg.madinah_ziyarat_id} does not exist!"
            print(msg)
            issues_found.append(f"{pkg.package_code}: {msg}")
    else:
        print(f"  Madinah Ziyarat: Not configured")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

total = packages.count()
with_food = UmrahPackage.objects.filter(food_price_id__isnull=False).count()
with_makkah = UmrahPackage.objects.filter(makkah_ziyarat_id__isnull=False).count()
with_madinah = UmrahPackage.objects.filter(madinah_ziyarat_id__isnull=False).count()

print(f"\nTotal Packages: {total}")
print(f"With Food: {with_food}")
print(f"With Makkah Ziyarat: {with_makkah}")
print(f"With Madinah Ziyarat: {with_madinah}")

if issues_found:
    print(f"\n\nISSUES FOUND ({len(issues_found)}):")
    for issue in issues_found:
        print(f"  - {issue}")
else:
    print(f"\n\nNo issues found! All packages have valid references.")

print("\n" + "=" * 80)
