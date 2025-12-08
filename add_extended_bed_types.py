# -*- coding: utf-8 -*-
"""
Add extended bed types (6-10) and update Emarat Hotel with prices
"""

import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000/api"
ORGANIZATION_ID = 11
HOTEL_ID = 57  # Emarat Hotel

# JWT Token
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk2NTYwOTg0LCJpYXQiOjE3NjUwMjQ5ODQsImp0aSI6ImNiMWMwZDM1OWNlMTRhNzc5NjE2NzEzNWY3MmY2YzU4IiwidXNlcl9pZCI6MzV9.5f5D7m0bcIIKqZcWP_cARTFAfOTXimR5I0eKq0mD0TA"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def create_extended_bed_types():
    """Create bed types for 6, 7, 8, 9, 10 beds"""
    bed_types = [
        {"name": "6 Bed", "capacity": 6, "slug": "6"},
        {"name": "7 Bed", "capacity": 7, "slug": "7"},
        {"name": "8 Bed", "capacity": 8, "slug": "8"},
        {"name": "9 Bed", "capacity": 9, "slug": "9"},
        {"name": "10 Bed", "capacity": 10, "slug": "10"},
    ]
    
    created = []
    for bed_type in bed_types:
        try:
            response = requests.post(
                f"{BASE_URL}/bed-types/",
                params={"organization": ORGANIZATION_ID},
                headers=headers,
                json=bed_type
            )
            if response.status_code in [200, 201]:
                created.append(response.json())
                print(f"[OK] Created bed type: {bed_type['name']}")
            else:
                print(f"[INFO] Bed type {bed_type['name']} might already exist: {response.status_code}")
        except Exception as e:
            print(f"[ERROR] Error creating bed type {bed_type['name']}: {e}")
    
    return created

def add_extended_prices_to_hotel():
    """Add prices for 6-10 bed types to Emarat Hotel"""
    
    # First, get current hotel data
    try:
        response = requests.get(
            f"{BASE_URL}/hotels/{HOTEL_ID}/",
            params={"organization": ORGANIZATION_ID},
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"[ERROR] Failed to fetch hotel: {response.status_code}")
            return
        
        hotel = response.json()
        current_prices = hotel.get('prices', [])
        
        print(f"\n[INFO] Current hotel has {len(current_prices)} price entries")
        
        # Extended bed type prices for both periods
        extended_prices = [
            # Period 1: Dec 15-25
            {"start_date": "2025-12-15", "end_date": "2025-12-25", "room_type": "6-bed", "price": 4000, "selling_price": 4000, "purchase_price": 3200, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-25", "room_type": "7-bed", "price": 4500, "selling_price": 4500, "purchase_price": 3600, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-25", "room_type": "8-bed", "price": 5000, "selling_price": 5000, "purchase_price": 4000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-25", "room_type": "9-bed", "price": 5500, "selling_price": 5500, "purchase_price": 4400, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-25", "room_type": "10-bed", "price": 6000, "selling_price": 6000, "purchase_price": 4800, "is_sharing_allowed": False},
            
            # Period 2: Dec 26 - Jan 5
            {"start_date": "2025-12-26", "end_date": "2026-01-05", "room_type": "6-bed", "price": 4500, "selling_price": 4500, "purchase_price": 3600, "is_sharing_allowed": False},
            {"start_date": "2025-12-26", "end_date": "2026-01-05", "room_type": "7-bed", "price": 5000, "selling_price": 5000, "purchase_price": 4000, "is_sharing_allowed": False},
            {"start_date": "2025-12-26", "end_date": "2026-01-05", "room_type": "8-bed", "price": 5500, "selling_price": 5500, "purchase_price": 4400, "is_sharing_allowed": False},
            {"start_date": "2025-12-26", "end_date": "2026-01-05", "room_type": "9-bed", "price": 6000, "selling_price": 6000, "purchase_price": 4800, "is_sharing_allowed": False},
            {"start_date": "2025-12-26", "end_date": "2026-01-05", "room_type": "10-bed", "price": 6500, "selling_price": 6500, "purchase_price": 5200, "is_sharing_allowed": False},
        ]
        
        # Combine current prices with new extended prices
        all_prices = current_prices + extended_prices
        
        # Update hotel with all prices
        payload = {
            "prices": all_prices
        }
        
        response = requests.patch(
            f"{BASE_URL}/hotels/{HOTEL_ID}/",
            params={"organization": ORGANIZATION_ID},
            headers=headers,
            json=payload
        )
        
        if response.status_code in [200, 201]:
            updated_hotel = response.json()
            print(f"\n[SUCCESS] Updated Emarat Hotel with extended bed type prices!")
            print(f"Total prices now: {len(updated_hotel.get('prices', []))}")
            
            print("\n[INFO] Extended bed type prices added:")
            print("Period 1 (Dec 15-25):")
            print("  6 Bed: 4000 SAR (Purchase: 3200 SAR)")
            print("  7 Bed: 4500 SAR (Purchase: 3600 SAR)")
            print("  8 Bed: 5000 SAR (Purchase: 4000 SAR)")
            print("  9 Bed: 5500 SAR (Purchase: 4400 SAR)")
            print("  10 Bed: 6000 SAR (Purchase: 4800 SAR)")
            
            print("\nPeriod 2 (Dec 26 - Jan 5):")
            print("  6 Bed: 4500 SAR (Purchase: 3600 SAR)")
            print("  7 Bed: 5000 SAR (Purchase: 4000 SAR)")
            print("  8 Bed: 5500 SAR (Purchase: 4400 SAR)")
            print("  9 Bed: 6000 SAR (Purchase: 4800 SAR)")
            print("  10 Bed: 6500 SAR (Purchase: 5200 SAR)")
            
            return updated_hotel
        else:
            print(f"[ERROR] Failed to update hotel: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Error updating hotel: {e}")
        return None

if __name__ == "__main__":
    print("=" * 100)
    print("ADDING EXTENDED BED TYPES (6-10) AND PRICES TO EMARAT HOTEL")
    print("=" * 100)
    
    print("\nStep 1: Creating bed types...")
    create_extended_bed_types()
    
    print("\nStep 2: Adding prices to Emarat Hotel...")
    add_extended_prices_to_hotel()
    
    print("\n" + "=" * 100)
    print("[DONE] Extended bed types and prices added!")
    print("\nNow you can:")
    print("1. Refresh the browser")
    print("2. Edit Emarat Hotel")
    print("3. Select 6, 7, 8, 9, or 10 bed types when adding prices")
    print("4. Click 'Show Prices' to see the complete pivot table with all bed types!")
    print("=" * 100)
