# -*- coding: utf-8 -*-
"""
Create Burj Al Arab Hotel in Dubai with all bed types
Includes: Sharing, Double, Triple, Quad, Quint, 6, 7, 8, 9, 10 Bed
With 2 separate price periods
"""

import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000/api"
ORGANIZATION_ID = 11

# JWT Token
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk2NTYwOTg0LCJpYXQiOjE3NjUwMjQ5ODQsImp0aSI6ImNiMWMwZDM1OWNlMTRhNzc5NjE2NzEzNWY3MmY2YzU4IiwidXNlcl9pZCI6MzV9.5f5D7m0bcIIKqZcWP_cARTFAfOTXimR5I0eKq0mD0TA"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def get_dubai_city_id():
    """Get Dubai city ID"""
    try:
        response = requests.get(
            f"{BASE_URL}/cities/",
            params={"organization": ORGANIZATION_ID},
            headers=headers
        )
        if response.status_code == 200:
            cities = response.json()
            for city in cities:
                if 'dubai' in city.get('name', '').lower():
                    print(f"[OK] Found Dubai city with ID: {city['id']}")
                    return city['id']
        print("[INFO] Dubai city not found")
    except Exception as e:
        print(f"[ERROR] Error getting cities: {e}")
    return None

def get_category_id():
    """Get 5 Star category ID"""
    try:
        response = requests.get(
            f"{BASE_URL}/hotel-categories/",
            params={"organization": ORGANIZATION_ID},
            headers=headers
        )
        if response.status_code == 200:
            categories = response.json()
            for cat in categories:
                if '5 star' in cat.get('name', '').lower():
                    print(f"[OK] Found 5 Star category with ID: {cat['id']}")
                    return cat['id']
        print("[INFO] 5 Star category not found")
    except Exception as e:
        print(f"[ERROR] Error getting categories: {e}")
    return None

def create_burj_al_arab():
    """Create Burj Al Arab Hotel with complete data"""
    
    print("\n[START] Creating Burj Al Arab Hotel in Dubai...\n")
    
    # Get Dubai city ID
    print("Step 1: Getting Dubai city ID...")
    city_id = get_dubai_city_id()
    
    if not city_id:
        print("[ERROR] Cannot proceed without Dubai city ID")
        return
    
    # Get category ID
    print("\nStep 2: Getting hotel category...")
    category_id = get_category_id()
    
    # Create hotel data
    print("\nStep 3: Creating Burj Al Arab Hotel...")
    
    hotel_data = {
        "name": "Burj Al Arab",
        "city": city_id,
        "address": "Jumeirah Street, Dubai, UAE",
        "google_location": "https://maps.google.com/?q=Burj+Al+Arab+Dubai",
        "contact_number": "+971-4-301-7777",
        "category": category_id,
        "distance": "3",
        "walking_time": "35",
        "walking_distance": "3000",
        "is_active": True,
        "available_start_date": "2025-12-15",
        "available_end_date": "2026-02-28",
        "owner_organization_id": ORGANIZATION_ID,
        
        # Contact details
        "contact_details": [
            {
                "contact_person": "Luxury Concierge",
                "contact_number": "+971-4-301-7777"
            }
        ],
        
        # All bed type prices for 2 periods
        "prices": [
            # ===== PERIOD 1: Dec 15 - Dec 31, 2025 =====
            # Room price
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "room", "price": 50000, "selling_price": 50000, "purchase_price": 40000, "is_sharing_allowed": False},
            
            # Bed-specific prices
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "sharing", "price": 45000, "selling_price": 45000, "purchase_price": 36000, "is_sharing_allowed": True},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "double", "price": 55000, "selling_price": 55000, "purchase_price": 44000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "triple", "price": 60000, "selling_price": 60000, "purchase_price": 48000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "quad", "price": 65000, "selling_price": 65000, "purchase_price": 52000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "quint", "price": 70000, "selling_price": 70000, "purchase_price": 56000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "6-bed", "price": 75000, "selling_price": 75000, "purchase_price": 60000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "7-bed", "price": 80000, "selling_price": 80000, "purchase_price": 64000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "8-bed", "price": 85000, "selling_price": 85000, "purchase_price": 68000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "9-bed", "price": 90000, "selling_price": 90000, "purchase_price": 72000, "is_sharing_allowed": False},
            {"start_date": "2025-12-15", "end_date": "2025-12-31", "room_type": "10-bed", "price": 95000, "selling_price": 95000, "purchase_price": 76000, "is_sharing_allowed": False},
            
            # ===== PERIOD 2: Jan 1 - Feb 28, 2026 =====
            # Room price
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "room", "price": 60000, "selling_price": 60000, "purchase_price": 48000, "is_sharing_allowed": False},
            
            # Bed-specific prices
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "sharing", "price": 55000, "selling_price": 55000, "purchase_price": 44000, "is_sharing_allowed": True},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "double", "price": 65000, "selling_price": 65000, "purchase_price": 52000, "is_sharing_allowed": False},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "triple", "price": 70000, "selling_price": 70000, "purchase_price": 56000, "is_sharing_allowed": False},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "quad", "price": 75000, "selling_price": 75000, "purchase_price": 60000, "is_sharing_allowed": False},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "quint", "price": 80000, "selling_price": 80000, "purchase_price": 64000, "is_sharing_allowed": False},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "6-bed", "price": 85000, "selling_price": 85000, "purchase_price": 68000, "is_sharing_allowed": False},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "7-bed", "price": 90000, "selling_price": 90000, "purchase_price": 72000, "is_sharing_allowed": False},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "8-bed", "price": 95000, "selling_price": 95000, "purchase_price": 76000, "is_sharing_allowed": False},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "9-bed", "price": 100000, "selling_price": 100000, "purchase_price": 80000, "is_sharing_allowed": False},
            {"start_date": "2026-01-01", "end_date": "2026-02-28", "room_type": "10-bed", "price": 105000, "selling_price": 105000, "purchase_price": 84000, "is_sharing_allowed": False},
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/hotels/",
            params={"organization": ORGANIZATION_ID},
            headers=headers,
            json=hotel_data
        )
        
        if response.status_code in [200, 201]:
            hotel = response.json()
            print(f"\n[SUCCESS] Successfully created Burj Al Arab Hotel!")
            print(f"Hotel ID: {hotel.get('id')}")
            print(f"Hotel Name: {hotel.get('name')}")
            print(f"Total Prices: {len(hotel.get('prices', []))}")
            
            print(f"\n[INFO] Pivot Table Preview:")
            print("=" * 140)
            print("| Start Date | End Date   | Room   | Sharing | Double | Triple | Quad   | Quint  | 6 Bed  | 7 Bed  | 8 Bed  | 9 Bed   | 10 Bed  |")
            print("|------------|------------|--------|---------|--------|--------|--------|--------|--------|--------|--------|---------|---------|")
            print("| 2025-12-15 | 2025-12-31 | 40,000 | 36,000  | 44,000 | 48,000 | 52,000 | 56,000 | 60,000 | 64,000 | 68,000 | 72,000  | 76,000  |")
            print("| 2026-01-01 | 2026-02-28 | 48,000 | 44,000  | 52,000 | 56,000 | 60,000 | 64,000 | 68,000 | 72,000 | 76,000 | 80,000  | 84,000  |")
            print("=" * 140)
            print("\n[DONE] Now go to the Hotel Availability Manager and click 'Show Prices' to see the complete pivot table!")
            
            return hotel
        else:
            print(f"[ERROR] Error creating hotel: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Error creating hotel: {e}")
        return None

if __name__ == "__main__":
    print("=" * 140)
    print("BURJ AL ARAB HOTEL CREATION SCRIPT")
    print("=" * 140)
    print("\nCreating luxury hotel with ALL bed types:")
    print("- Room, Sharing, Double, Triple, Quad, Quint, 6, 7, 8, 9, 10 Bed")
    print("- 2 Price Periods: Dec 15-31, 2025 & Jan 1 - Feb 28, 2026")
    print("- Organization ID: 11")
    print("\n" + "=" * 140 + "\n")
    
    create_burj_al_arab()
