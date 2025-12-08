# -*- coding: utf-8 -*-
"""
Check Emarat Hotel organization ownership
"""

import requests

# API Configuration
BASE_URL = "http://localhost:8000/api"
ORGANIZATION_ID = 11

# JWT Token
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk2NTYwOTg0LCJpYXQiOjE3NjUwMjQ5ODQsImp0aSI6ImNiMWMwZDM1OWNlMTRhNzc5NjE2NzEzNWY3MmY2YzU4IiwidXNlcl9pZCI6MzV9.5f5D7m0bcIIKqZcWP_cARTFAfOTXimR5I0eKq0mD0TA"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def check_hotel():
    """Check Emarat Hotel details"""
    try:
        # Get all hotels for organization 11
        response = requests.get(
            f"{BASE_URL}/hotels/",
            params={"organization": ORGANIZATION_ID},
            headers=headers
        )
        
        if response.status_code == 200:
            hotels = response.json()
            
            # Find Emarat Hotel
            emarat = None
            for hotel in hotels:
                if 'emarat' in hotel.get('name', '').lower():
                    emarat = hotel
                    break
            
            if emarat:
                print("[SUCCESS] Found Emarat Hotel!")
                print(f"\nHotel ID: {emarat.get('id')}")
                print(f"Hotel Name: {emarat.get('name')}")
                print(f"Organization: {emarat.get('organization')}")
                print(f"Organization ID: {emarat.get('organization_id')}")
                print(f"Owner Organization: {emarat.get('owner_organization')}")
                print(f"Owner Organization ID: {emarat.get('owner_organization_id')}")
                
                print(f"\n[INFO] Current logged-in organization: {ORGANIZATION_ID}")
                
                # Check if they match
                hotel_org = emarat.get('owner_organization_id') or emarat.get('organization') or emarat.get('organization_id')
                if str(hotel_org) == str(ORGANIZATION_ID):
                    print("[OK] Organization IDs match! You should be able to edit this hotel.")
                else:
                    print(f"[PROBLEM] Organization mismatch!")
                    print(f"  Hotel belongs to organization: {hotel_org}")
                    print(f"  You are logged in as organization: {ORGANIZATION_ID}")
                    print(f"\n[FIX] Need to update hotel's owner_organization_id to {ORGANIZATION_ID}")
                
                return emarat
            else:
                print("[ERROR] Emarat Hotel not found in the list")
                print(f"Found {len(hotels)} hotels total")
                for h in hotels:
                    print(f"  - {h.get('name')} (ID: {h.get('id')})")
        else:
            print(f"[ERROR] Failed to fetch hotels: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error checking hotel: {e}")

if __name__ == "__main__":
    print("=" * 80)
    print("CHECKING EMARAT HOTEL ORGANIZATION")
    print("=" * 80)
    print()
    
    check_hotel()
