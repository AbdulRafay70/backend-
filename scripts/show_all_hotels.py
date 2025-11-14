#!/usr/bin/env python3
"""
Simple script to display all hotels data as pretty JSON.
Run: python scripts\show_all_hotels.py
This script assumes your Django settings module is `configuration.settings` (same as the project).
"""
import os
import sys
import django
import json
from django.core.serializers.json import DjangoJSONEncoder

# Ensure project root is on sys.path so Django settings module can be imported
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
# Initialize Django
django.setup()

from tickets.models import Hotels


def hotel_to_dict(hotel):
    def safe_url(field):
        try:
            return field.url if field else None
        except Exception:
            return None

    data = {
        "id": hotel.id,
        "name": hotel.name,
        "address": hotel.address,
        "google_location": hotel.google_location or None,
        "reselling_allowed": hotel.reselling_allowed,
        "contact_number": hotel.contact_number or None,
        "category": hotel.category,
        "distance": float(hotel.distance) if hotel.distance is not None else None,
        "is_active": hotel.is_active,
        "available_start_date": (hotel.available_start_date.isoformat() if hotel.available_start_date else None),
        "available_end_date": (hotel.available_end_date.isoformat() if hotel.available_end_date else None),
        "organization": hotel.organization_id if hasattr(hotel, 'organization_id') else None,
        "organization_name": (hotel.organization.name if getattr(hotel, 'organization', None) else None),
        # include both city id and human-readable city name so listings show proper names
        "city": hotel.city_id if hasattr(hotel, 'city_id') else None,
        "city_name": (hotel.city.name if getattr(hotel, 'city', None) else None),
    }

    # Prices
    prices = []
    for p in hotel.prices.all():
        prices.append({
            "id": p.id,
            "start_date": (p.start_date.isoformat() if p.start_date else None),
            "end_date": (p.end_date.isoformat() if p.end_date else None),
            "room_type": p.room_type,
            "price": float(p.price) if p.price is not None else None,
            "is_sharing_allowed": p.is_sharing_allowed,
        })
    data["prices"] = prices

    # Contact details
    contacts = []
    for c in hotel.contact_details.all():
        contacts.append({
            "id": c.id,
            "contact_person": c.contact_person,
            "contact_number": c.contact_number,
        })
    data["contact_details"] = contacts

    # Photos
    photos = []
    for ph in hotel.photos.all():
        photos.append({
            "id": ph.id,
            "caption": ph.caption or None,
            "image": safe_url(getattr(ph, 'image', None)),
        })
    data["photos_data"] = photos

    # Video (if available)
    data["video"] = safe_url(getattr(hotel, 'video', None))

    return data


def main():
    qs = Hotels.objects.all().prefetch_related('prices', 'contact_details', 'photos')
    all_hotels = [hotel_to_dict(h) for h in qs]

    print(json.dumps(all_hotels, indent=2, cls=DjangoJSONEncoder, default=str))


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        import traceback
        print("Error running show_all_hotels.py:\n", str(e))
        traceback.print_exc()
