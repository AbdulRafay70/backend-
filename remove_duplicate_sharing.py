"""
Script to remove duplicate 'sharing' room type prices from hotels.
Only keep one 'sharing' price entry per date range per hotel.
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
print("REMOVING DUPLICATE SHARING PRICES")
print("="*80)

hotels = Hotels.objects.filter(organization=org)
total_removed = 0

for hotel in hotels:
    # Get all prices for this hotel
    prices = HotelPrices.objects.filter(hotel=hotel, room_type='sharing').order_by('start_date', 'end_date', 'id')
    
    # Group by date range
    seen_ranges = set()
    to_delete = []
    
    for price in prices:
        range_key = f"{price.start_date}_{price.end_date}"
        if range_key in seen_ranges:
            # This is a duplicate
            to_delete.append(price.id)
        else:
            seen_ranges.add(range_key)
    
    if to_delete:
        deleted_count = HotelPrices.objects.filter(id__in=to_delete).delete()[0]
        total_removed += deleted_count
        print(f"✓ {hotel.name}: Removed {deleted_count} duplicate 'sharing' entries")

print("\n" + "="*80)
print(f"Total duplicate 'sharing' entries removed: {total_removed}")
print("="*80)
