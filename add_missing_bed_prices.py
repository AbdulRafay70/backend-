"""
Script to add missing bed type prices (6-bed to 10-bed) for all hotels.
Calculates prices based on the existing pattern (15% increase per person).
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
print("ADDING MISSING BED TYPE PRICES (6-BED TO 10-BED)")
print("="*80)

hotels = Hotels.objects.filter(organization=org)
total_added = 0

for hotel in hotels:
    print(f"\nProcessing: {hotel.name}")
    
    # Get all existing price entries grouped by date range
    price_groups = {}
    existing_prices = HotelPrices.objects.filter(hotel=hotel).order_by('start_date', 'end_date')
    
    for price in existing_prices:
        key = f"{price.start_date}_{price.end_date}"
        if key not in price_groups:
            price_groups[key] = {}
        price_groups[key][price.room_type] = price
    
    # For each date range, add missing bed types
    for date_key, prices_dict in price_groups.items():
        start_date, end_date = date_key.split('_')
        
        # Check if we have a base price to calculate from
        # Try to get quint price as reference
        base_price = None
        base_purchase = None
        
        if 'quint' in prices_dict:
            base_price = prices_dict['quint'].price
            base_purchase = prices_dict['quint'].purchase_price
        elif 'quad' in prices_dict:
            # If no quint, use quad and add 15%
            base_price = prices_dict['quad'].price * 1.15 if prices_dict['quad'].price else 0
            base_purchase = prices_dict['quad'].purchase_price * 1.15 if prices_dict['quad'].purchase_price else 0
        elif 'triple' in prices_dict:
            # If no quad, use triple and add 30%
            base_price = prices_dict['triple'].price * 1.30 if prices_dict['triple'].price else 0
            base_purchase = prices_dict['triple'].purchase_price * 1.30 if prices_dict['triple'].purchase_price else 0
        
        if not base_price:
            print(f"  ⚠ Skipping {start_date} to {end_date} - no base price found")
            continue
        
        # Add missing bed types (6-bed to 10-bed)
        missing_types = ['6-bed', '7-bed', '8-bed', '9-bed', '10-bed']
        
        for idx, bed_type in enumerate(missing_types):
            if bed_type not in prices_dict:
                # Calculate price: each additional person adds 15%
                # 6-bed is 1 person more than quint (5), so 15% more
                multiplier = 1 + ((idx + 1) * 0.15)
                new_price = round(base_price * multiplier, 2)
                new_purchase = round(base_purchase * multiplier, 2) if base_purchase else 0
                
                # Create the price entry
                HotelPrices.objects.create(
                    hotel=hotel,
                    room_type=bed_type,
                    price=new_price,
                    purchase_price=new_purchase,
                    start_date=start_date,
                    end_date=end_date,
                    is_sharing_allowed=(int(bed_type.split('-')[0]) >= 2)
                )
                
                total_added += 1
                print(f"  ✓ Added {bed_type} for {start_date} to {end_date}: {new_price} PKR (purchase: {new_purchase} PKR)")

print("\n" + "="*80)
print(f"Total price entries added: {total_added}")
print("="*80)

# Verify results for a sample hotel
print("\nVerifying results for Makkah Grand Hotel:")
sample_hotel = Hotels.objects.filter(organization=org, name='Makkah Grand Hotel').first()
if sample_hotel:
    sample_prices = HotelPrices.objects.filter(hotel=sample_hotel).order_by('start_date', 'room_type')
    current_range = None
    for p in sample_prices:
        range_key = f"{p.start_date} to {p.end_date}"
        if range_key != current_range:
            print(f"\n  {range_key}:")
            current_range = range_key
        print(f"    {p.room_type}: {p.price} PKR")
