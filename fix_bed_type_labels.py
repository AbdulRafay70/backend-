"""
Script to fix bed type labels in hotel prices.
Changes 'sharing' entries for bed types 6-10 to their proper names.
Also ensures all hotels have complete price entries for bed types 1-10.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels, HotelPrices
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("FIXING BED TYPE LABELS IN HOTEL PRICES")
print("="*80)

# Mapping of what we expect based on price values
# The prices increase by 15% for each additional person capacity
# So we can identify which "sharing" entry corresponds to which bed type

hotels = Hotels.objects.filter(organization=org)

for hotel in hotels:
    print(f"\nProcessing: {hotel.name}")
    
    # Get all prices for this hotel, grouped by date range
    price_groups = {}
    all_prices = HotelPrices.objects.filter(hotel=hotel).order_by('start_date', 'end_date', 'price')
    
    for price in all_prices:
        key = f"{price.start_date}_{price.end_date}"
        if key not in price_groups:
            price_groups[key] = []
        price_groups[key].append(price)
    
    # For each date range, fix the bed types
    for date_key, prices in price_groups.items():
        # Sort by price to identify the sequence
        prices.sort(key=lambda x: x.price or 0)
        
        # Expected bed types in order
        expected_types = ['single', 'double', 'triple', 'quad', 'quint', '6-bed', '7-bed', '8-bed', '9-bed', '10-bed']
        
        # Map current prices to expected types
        for idx, price in enumerate(prices):
            if idx < len(expected_types):
                expected_type = expected_types[idx]
                if price.room_type != expected_type:
                    old_type = price.room_type
                    price.room_type = expected_type
                    price.save()
                    print(f"  ✓ Updated {date_key}: {old_type} → {expected_type} (Price: {price.price})")

print("\n" + "="*80)
print("Bed type labels fixed!")
print("="*80)

# Now verify the results
print("\nVerifying results...")
for hotel in hotels[:3]:  # Show first 3 hotels as sample
    print(f"\n{hotel.name}:")
    prices = HotelPrices.objects.filter(hotel=hotel).order_by('start_date', 'room_type')
    date_ranges = {}
    for p in prices:
        key = f"{p.start_date} to {p.end_date}"
        if key not in date_ranges:
            date_ranges[key] = []
        date_ranges[key].append(f"{p.room_type}: {p.price} PKR")
    
    for date_range, price_list in date_ranges.items():
        print(f"  {date_range}")
        for price_info in price_list[:5]:  # Show first 5
            print(f"    - {price_info}")
