"""
Update food and ziyarat prices with proper selling and purchasing prices.
Then sync these prices to the packages.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage, FoodPrice, ZiaratPrice

print("=" * 80)
print("UPDATING FOOD AND ZIYARAT PRICES")
print("=" * 80)

# Update Food Prices
print("\n1. Updating Food Prices...")
food_prices = FoodPrice.objects.all()

for food in food_prices:
    # Set realistic prices based on food type
    if 'Standard' in food.title:
        food.adult_selling_price = 50.0
        food.adult_purchase_price = 35.0
        food.child_selling_price = 30.0
        food.child_purchase_price = 20.0
        food.infant_selling_price = 0.0
        food.infant_purchase_price = 0.0
    elif 'Deluxe' in food.title:
        food.adult_selling_price = 75.0
        food.adult_purchase_price = 55.0
        food.child_selling_price = 45.0
        food.child_purchase_price = 30.0
        food.infant_selling_price = 0.0
        food.infant_purchase_price = 0.0
    elif 'Premium' in food.title:
        food.adult_selling_price = 100.0
        food.adult_purchase_price = 75.0
        food.child_selling_price = 60.0
        food.child_purchase_price = 40.0
        food.infant_selling_price = 0.0
        food.infant_purchase_price = 0.0
    else:
        food.adult_selling_price = 50.0
        food.adult_purchase_price = 35.0
        food.child_selling_price = 30.0
        food.child_purchase_price = 20.0
        food.infant_selling_price = 0.0
        food.infant_purchase_price = 0.0
    
    food.save()
    print(f"   ✅ Updated {food.title}: Adult SAR {food.adult_selling_price} (Purchase: {food.adult_purchase_price})")

# Update Ziyarat Prices
print("\n2. Updating Ziyarat Prices...")
ziyarat_prices = ZiaratPrice.objects.all()

for ziyarat in ziyarat_prices:
    city_name = ziyarat.city.name if ziyarat.city else 'Unknown'
    
    # Set realistic prices based on ziyarat type and city
    if 'Full Day' in ziyarat.ziarat_title:
        ziyarat.adult_selling_price = 150.0
        ziyarat.adult_purchase_price = 120.0
        ziyarat.child_selling_price = 100.0
        ziyarat.child_purchase_price = 75.0
        ziyarat.infant_selling_price = 0.0
        ziyarat.infant_purchase_price = 0.0
    elif 'Half Day' in ziyarat.ziarat_title:
        ziyarat.adult_selling_price = 100.0
        ziyarat.adult_purchase_price = 80.0
        ziyarat.child_selling_price = 70.0
        ziyarat.child_purchase_price = 50.0
        ziyarat.infant_selling_price = 0.0
        ziyarat.infant_purchase_price = 0.0
    elif 'Historical' in ziyarat.ziarat_title or 'Tour' in ziyarat.ziarat_title:
        ziyarat.adult_selling_price = 120.0
        ziyarat.adult_purchase_price = 95.0
        ziyarat.child_selling_price = 80.0
        ziyarat.child_purchase_price = 60.0
        ziyarat.infant_selling_price = 0.0
        ziyarat.infant_purchase_price = 0.0
    else:
        ziyarat.adult_selling_price = 100.0
        ziyarat.adult_purchase_price = 80.0
        ziyarat.child_selling_price = 70.0
        ziyarat.child_purchase_price = 50.0
        ziyarat.infant_selling_price = 0.0
        ziyarat.infant_purchase_price = 0.0
    
    ziyarat.save()
    print(f"   ✅ Updated {ziyarat.ziarat_title} ({city_name}): Adult SAR {ziyarat.adult_selling_price} (Purchase: {ziyarat.adult_purchase_price})")

# Now update package prices based on selected options
print("\n3. Syncing prices to packages...")
packages = UmrahPackage.objects.all()

for pkg in packages:
    updated = False
    
    # Update food prices
    if pkg.food_price_id:
        try:
            food = FoodPrice.objects.get(id=pkg.food_price_id)
            pkg.food_selling_price = food.adult_selling_price
            pkg.food_purchase_price = food.adult_purchase_price
            updated = True
        except FoodPrice.DoesNotExist:
            pass
    
    # Update Makkah ziyarat prices
    if pkg.makkah_ziyarat_id:
        try:
            ziyarat = ZiaratPrice.objects.get(id=pkg.makkah_ziyarat_id)
            pkg.makkah_ziyarat_selling_price = ziyarat.adult_selling_price
            pkg.makkah_ziyarat_purchase_price = ziyarat.adult_purchase_price
            updated = True
        except ZiaratPrice.DoesNotExist:
            pass
    
    # Update Madinah ziyarat prices
    if pkg.madinah_ziyarat_id:
        try:
            ziyarat = ZiaratPrice.objects.get(id=pkg.madinah_ziyarat_id)
            pkg.madinah_ziyarat_selling_price = ziyarat.adult_selling_price
            pkg.madinah_ziyarat_purchase_price = ziyarat.adult_purchase_price
            updated = True
        except ZiaratPrice.DoesNotExist:
            pass
    
    if updated:
        pkg.save()
        print(f"   ✅ Updated {pkg.title}")
        print(f"      Food: SAR {pkg.food_selling_price} (Purchase: {pkg.food_purchase_price})")
        print(f"      Makkah Ziyarat: SAR {pkg.makkah_ziyarat_selling_price} (Purchase: {pkg.makkah_ziyarat_purchase_price})")
        print(f"      Madinah Ziyarat: SAR {pkg.madinah_ziyarat_selling_price} (Purchase: {pkg.madinah_ziyarat_purchase_price})")

print("\n" + "=" * 80)
print("✅ ALL PRICES UPDATED!")
print("=" * 80)

# Verification
print("\nVerification Summary:")
packages = UmrahPackage.objects.all()
for pkg in packages:
    print(f"\n{pkg.title}:")
    print(f"  Food: Selling SAR {pkg.food_selling_price}, Purchase SAR {pkg.food_purchase_price}")
    print(f"  Makkah: Selling SAR {pkg.makkah_ziyarat_selling_price}, Purchase SAR {pkg.makkah_ziyarat_purchase_price}")
    print(f"  Madinah: Selling SAR {pkg.madinah_ziyarat_selling_price}, Purchase SAR {pkg.madinah_ziyarat_purchase_price}")

print("\n" + "=" * 80)
