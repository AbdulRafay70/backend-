"""
Script to clear all hotels from the database.
Usage: python clear_hotels.py
"""

import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels, HotelPrices, HotelContactDetails, HotelPhoto

def main():
    print("🗑️ Clearing all hotels from database...")
    
    # Get counts before deletion
    hotels_count = Hotels.objects.count()
    prices_count = HotelPrices.objects.count()
    contacts_count = HotelContactDetails.objects.count()
    photos_count = HotelPhoto.objects.count()
    
    print(f"\nFound:")
    print(f"  - {hotels_count} hotels")
    print(f"  - {prices_count} price entries")
    print(f"  - {contacts_count} contact details")
    print(f"  - {photos_count} photos")
    
    # Delete all
    HotelPhoto.objects.all().delete()
    HotelContactDetails.objects.all().delete()
    HotelPrices.objects.all().delete()
    Hotels.objects.all().delete()
    
    print("\n✅ All hotels and related data cleared!")

if __name__ == "__main__":
    main()
