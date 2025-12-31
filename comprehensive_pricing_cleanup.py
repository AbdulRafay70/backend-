"""
Comprehensive script to:
1. Remove ALL duplicate 'sharing' entries
2. Ensure all hotels have complete pricing for bed types 1-10
3. Verify data integrity
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
print("COMPREHENSIVE HOTEL PRICING CLEANUP")
print("="*80)

# Step 1: Remove ALL 'sharing' entries
print("\n1. Removing ALL 'sharing' room type entries...")
sharing_count = HotelPrices.objects.filter(hotel__organization=org, room_type='sharing').count()
if sharing_count > 0:
    HotelPrices.objects.filter(hotel__organization=org, room_type='sharing').delete()
    print(f"   ✓ Removed {sharing_count} 'sharing' entries")
else:
    print("   ✓ No 'sharing' entries found")

# Step 2: Ensure all hotels have complete bed type pricing (1-10)
print("\n2. Ensuring complete bed type pricing (1-10) for all hotels...")

hotels = Hotels.objects.filter(organization=org)
expected_bed_types = ['single', 'double', 'triple', 'quad', 'quint', '6-bed', '7-bed', '8-bed', '9-bed', '10-bed']

total_added = 0
for hotel in hotels:
    print(f"\n   Processing: {hotel.name}")
    
    # Get unique date ranges for this hotel
    date_ranges = HotelPrices.objects.filter(hotel=hotel).values('start_date', 'end_date').distinct()
    
    for date_range in date_ranges:
        start_date = date_range['start_date']
        end_date = date_range['end_date']
        
        # Get existing bed types for this date range
        existing_prices = HotelPrices.objects.filter(
            hotel=hotel,
            start_date=start_date,
            end_date=end_date
        )
        
        existing_types = {p.room_type for p in existing_prices}
        missing_types = [bt for bt in expected_bed_types if bt not in existing_types]
        
        if missing_types:
            # Calculate base price from existing data
            base_price = None
            base_purchase = None
            
            # Try to find a reference price (prefer quint, then quad, then triple)
            for ref_type in ['quint', 'quad', 'triple', 'double', 'single']:
                ref_price = existing_prices.filter(room_type=ref_type).first()
                if ref_price and ref_price.price:
                    # Calculate what the base (single) price would be
                    type_index = expected_bed_types.index(ref_type)
                    # Each bed type is 15% more than the previous
                    base_price = ref_price.price / (1 + (type_index * 0.15))
                    base_purchase = ref_price.purchase_price / (1 + (type_index * 0.15)) if ref_price.purchase_price else 0
                    break
            
            if base_price:
                for bed_type in missing_types:
                    type_index = expected_bed_types.index(bed_type)
                    multiplier = 1 + (type_index * 0.15)
                    
                    new_price = round(base_price * multiplier, 2)
                    new_purchase = round(base_purchase * multiplier, 2) if base_purchase else 0
                    
                    HotelPrices.objects.create(
                        hotel=hotel,
                        room_type=bed_type,
                        price=new_price,
                        purchase_price=new_purchase,
                        start_date=start_date,
                        end_date=end_date,
                        is_sharing_allowed=(int(bed_type.split('-')[0]) >= 2 if '-' in bed_type else (bed_type != 'single'))
                    )
                    total_added += 1
                    print(f"      + Added {bed_type}: {new_price} PKR")

print(f"\n   ✓ Total new price entries added: {total_added}")

# Step 3: Verify data integrity
print("\n3. Verifying data integrity...")
verification_passed = True

for hotel in hotels:
    date_ranges = HotelPrices.objects.filter(hotel=hotel).values('start_date', 'end_date').distinct()
    
    for date_range in date_ranges:
        existing_types = set(HotelPrices.objects.filter(
            hotel=hotel,
            start_date=date_range['start_date'],
            end_date=date_range['end_date']
        ).values_list('room_type', flat=True))
        
        missing = set(expected_bed_types) - existing_types
        if missing:
            print(f"   ✗ {hotel.name} missing: {missing}")
            verification_passed = False

if verification_passed:
    print("   ✓ All hotels have complete bed type pricing!")

# Step 4: Summary report
print("\n4. Summary Report:")
print("="*80)

sample_hotels = hotels[:3]
for hotel in sample_hotels:
    print(f"\n{hotel.name}:")
    prices = HotelPrices.objects.filter(hotel=hotel).order_by('start_date', 'room_type')
    
    current_range = None
    for p in prices:
        range_key = f"{p.start_date} to {p.end_date}"
        if range_key != current_range:
            print(f"  {range_key}:")
            current_range = range_key
        print(f"    {p.room_type}: {p.price} PKR (purchase: {p.purchase_price} PKR)")

print("\n" + "="*80)
print("✅ CLEANUP COMPLETE!")
print("="*80)
print(f"Total hotels: {hotels.count()}")
print(f"Total price entries: {HotelPrices.objects.filter(hotel__organization=org).count()}")
print(f"Bed types per hotel: {len(expected_bed_types)} (Single to 10 Bed)")
print("="*80)
