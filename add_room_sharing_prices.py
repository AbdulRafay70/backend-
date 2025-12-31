"""
Script to add 'room' and 'sharing' prices to all hotels.
Room price will be the base price (lowest).
Sharing price will be between single and double.
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
print("ADDING ROOM AND SHARING PRICES TO ALL HOTELS")
print("="*80)

hotels = Hotels.objects.filter(organization=org)
total_added = 0

for hotel in hotels:
    print(f"\nProcessing: {hotel.name}")
    
    # Get unique date ranges for this hotel
    date_ranges = HotelPrices.objects.filter(hotel=hotel).values('start_date', 'end_date').distinct()
    
    for date_range in date_ranges:
        start_date = date_range['start_date']
        end_date = date_range['end_date']
        
        # Get existing prices for this date range
        existing_prices = HotelPrices.objects.filter(
            hotel=hotel,
            start_date=start_date,
            end_date=end_date
        )
        
        existing_types = {p.room_type for p in existing_prices}
        
        # Check if we need to add room or sharing
        needs_room = 'room' not in existing_types
        needs_sharing = 'sharing' not in existing_types
        
        if needs_room or needs_sharing:
            # Get single price as reference (or the lowest price available)
            single_price = existing_prices.filter(room_type='single').first()
            
            if not single_price:
                # If no single, get the lowest price
                single_price = existing_prices.order_by('price').first()
            
            if single_price:
                # Room price = 90% of single (slightly cheaper)
                room_selling = round(single_price.price * 0.9, 2) if single_price.price else 0
                room_purchase = round(single_price.purchase_price * 0.9, 2) if single_price.purchase_price else 0
                
                # Sharing price = 95% of single (between room and single)
                sharing_selling = round(single_price.price * 0.95, 2) if single_price.price else 0
                sharing_purchase = round(single_price.purchase_price * 0.95, 2) if single_price.purchase_price else 0
                
                if needs_room:
                    HotelPrices.objects.create(
                        hotel=hotel,
                        room_type='room',
                        price=room_selling,
                        purchase_price=room_purchase,
                        start_date=start_date,
                        end_date=end_date,
                        is_sharing_allowed=False
                    )
                    total_added += 1
                    print(f"  ✓ Added room: {room_selling} PKR (purchase: {room_purchase} PKR)")
                
                if needs_sharing:
                    HotelPrices.objects.create(
                        hotel=hotel,
                        room_type='sharing',
                        price=sharing_selling,
                        purchase_price=sharing_purchase,
                        start_date=start_date,
                        end_date=end_date,
                        is_sharing_allowed=True
                    )
                    total_added += 1
                    print(f"  ✓ Added sharing: {sharing_selling} PKR (purchase: {sharing_purchase} PKR)")

print(f"\n{'='*80}")
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
        print(f"    {p.room_type}: {p.price} PKR (purchase: {p.purchase_price} PKR)")
