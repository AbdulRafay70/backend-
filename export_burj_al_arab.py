"""
Script to export Burj Al Arab hotel data from the database.
This will fetch the hotel and all related data (prices, contact details, rooms, photos).
"""
import os
import sys
import django
import json
from datetime import date

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels, HotelPrices, HotelContactDetails, HotelRooms, HotelPhoto


def export_burj_al_arab():
    """Export Burj Al Arab hotel data to JSON format."""
    
    print("=" * 80)
    print("BURJ AL ARAB HOTEL DATA EXPORT")
    print("=" * 80)
    
    # Find the hotel
    try:
        hotel = Hotels.objects.get(name__icontains="Burj Al Arab")
        print(f"\n[OK] Found hotel: {hotel.name}")
        print(f"  City: {hotel.city.name if hotel.city else 'N/A'}")
        print(f"  Address: {hotel.address}")
        print(f"  Category: {hotel.category}")
        print(f"  Status: {hotel.status}")
        print(f"  Contact: {hotel.contact_number}")
        print(f"  Available: {hotel.available_start_date} to {hotel.available_end_date}")
        
    except Hotels.DoesNotExist:
        print("\n[ERROR] Hotel 'Burj Al Arab' not found in database!")
        print("\nSearching for similar hotels...")
        similar_hotels = Hotels.objects.filter(name__icontains="Burj")
        if similar_hotels.exists():
            print("\nFound similar hotels:")
            for h in similar_hotels:
                print(f"  - {h.name} (ID: {h.id})")
        else:
            print("No hotels found with 'Burj' in the name.")
        return None
    except Hotels.MultipleObjectsReturned:
        print("\n[WARNING] Multiple hotels found with 'Burj Al Arab' in name:")
        hotels = Hotels.objects.filter(name__icontains="Burj Al Arab")
        for h in hotels:
            print(f"  - {h.name} (ID: {h.id})")
        print("\nPlease specify which hotel to export by ID.")
        return None
    
    # Prepare export data
    export_data = {
        'hotel': {
            'name': hotel.name,
            'city_name': hotel.city.name if hotel.city else None,
            'city_id': hotel.city.id if hotel.city else None,
            'address': hotel.address,
            'google_location': hotel.google_location,
            'reselling_allowed': hotel.reselling_allowed,
            'contact_number': hotel.contact_number,
            'category': hotel.category,
            'distance': hotel.distance,
            'walking_distance': hotel.walking_distance,
            'walking_time': hotel.walking_time,
            'is_active': hotel.is_active,
            'available_start_date': str(hotel.available_start_date) if hotel.available_start_date else None,
            'available_end_date': str(hotel.available_end_date) if hotel.available_end_date else None,
            'status': hotel.status,
            'owner_organization_id': hotel.owner_organization_id,
        },
        'prices': [],
        'contact_details': [],
        'rooms': [],
        'photos': []
    }
    
    # Get related prices
    prices = HotelPrices.objects.filter(hotel=hotel)
    print(f"\n[OK] Found {prices.count()} price records")
    for price in prices:
        export_data['prices'].append({
            'start_date': str(price.start_date),
            'end_date': str(price.end_date),
            'room_type': price.room_type,
            'price': float(price.price),
            'purchase_price': float(price.purchase_price) if price.purchase_price else 0,
            'is_sharing_allowed': price.is_sharing_allowed,
        })
        print(f"  - {price.room_type}: {price.price} ({price.start_date} to {price.end_date})")
    
    # Get contact details
    contacts = HotelContactDetails.objects.filter(hotel=hotel)
    print(f"\n[OK] Found {contacts.count()} contact detail records")
    for contact in contacts:
        export_data['contact_details'].append({
            'contact_person': contact.contact_person,
            'contact_number': contact.contact_number,
        })
    
    # Get rooms
    rooms = HotelRooms.objects.filter(hotel=hotel)
    print(f"\n[OK] Found {rooms.count()} room records")
    for room in rooms:
        export_data['rooms'].append({
            'room_number': room.room_number,
            'room_type': room.room_type,
            'floor': room.floor,
            'total_beds': room.total_beds,
        })


    
    # Get photos
    photos = HotelPhoto.objects.filter(hotel=hotel)
    print(f"\n[OK] Found {photos.count()} photo records")
    for photo in photos:
        export_data['photos'].append({
            'photo_url': photo.photo.url if photo.photo else None,
            'photo_path': photo.photo.name if photo.photo else None,
            'caption': photo.caption if hasattr(photo, 'caption') else None,
        })
    
    # Save to JSON file
    output_file = 'burj_al_arab_export.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n[OK] Data exported to: {output_file}")
    print("=" * 80)
    
    return export_data


if __name__ == "__main__":
    export_burj_al_arab()
