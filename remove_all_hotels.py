"""
Script to remove all hotels from the database for organization 11.
This will also delete all related hotel prices, photos, and other data.
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
print("REMOVING ALL HOTELS FROM DATABASE")
print("="*80)

# Get all hotels for organization 11
hotels = Hotels.objects.filter(organization=org)
hotel_count = hotels.count()

if hotel_count == 0:
    print("\nNo hotels found for organization 11.")
else:
    print(f"\nFound {hotel_count} hotels to delete:")
    for hotel in hotels:
        print(f"  - {hotel.name} ({hotel.city.name if hotel.city else 'No city'})")
    
    # Confirm deletion
    print(f"\n⚠️  WARNING: This will delete {hotel_count} hotels and all their related data!")
    print("   (prices, photos, rooms, etc.)")
    
    # Delete all hotels (cascade will delete related data)
    deleted_info = hotels.delete()
    
    print(f"\n✅ Successfully deleted:")
    print(f"   - {deleted_info[0]} total objects")
    print(f"   - Hotels: {deleted_info[1].get('tickets.Hotels', 0)}")
    print(f"   - Hotel Prices: {deleted_info[1].get('tickets.HotelPrices', 0)}")
    print(f"   - Other related objects: {deleted_info[0] - deleted_info[1].get('tickets.Hotels', 0) - deleted_info[1].get('tickets.HotelPrices', 0)}")

print("\n" + "="*80)
print("Database cleanup complete!")
print("="*80)
