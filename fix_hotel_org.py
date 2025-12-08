# -*- coding: utf-8 -*-
"""
Fix Emarat Hotel organization ownership
Update owner_organization_id to 11
"""

import requests

# API Configuration
BASE_URL = "http://localhost:8000/api"
ORGANIZATION_ID = 11
HOTEL_ID = 57  # Emarat Hotel ID

# JWT Token
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk2NTYwOTg0LCJpYXQiOjE3NjUwMjQ5ODQsImp0aSI6ImNiMWMwZDM1OWNlMTRhNzc5NjE2NzEzNWY3MmY2YzU4IiwidXNlcl9pZCI6MzV9.5f5D7m0bcIIKqZcWP_cARTFAfOTXimR5I0eKq0mD0TA"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def fix_hotel_organization():
    """Update Emarat Hotel's organization to 11"""
    try:
        # Update hotel with correct organization
        payload = {
            "owner_organization_id": ORGANIZATION_ID
        }
        
        response = requests.patch(
            f"{BASE_URL}/hotels/{HOTEL_ID}/",
            params={"organization": ORGANIZATION_ID},
            headers=headers,
            json=payload
        )
        
        if response.status_code in [200, 201]:
            hotel = response.json()
            print("[SUCCESS] Updated Emarat Hotel organization!")
            print(f"\nHotel ID: {hotel.get('id')}")
            print(f"Hotel Name: {hotel.get('name')}")
            print(f"Owner Organization ID: {hotel.get('owner_organization_id')}")
            print(f"\n[DONE] You can now edit this hotel in the UI!")
            return hotel
        else:
            print(f"[ERROR] Failed to update hotel: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Error updating hotel: {e}")
        return None

if __name__ == "__main__":
    print("=" * 80)
    print("FIXING EMARAT HOTEL ORGANIZATION")
    print("=" * 80)
    print(f"\nUpdating Hotel ID {HOTEL_ID} to Organization ID {ORGANIZATION_ID}...")
    print()
    
    fix_hotel_organization()
