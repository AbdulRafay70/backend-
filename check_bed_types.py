# -*- coding: utf-8 -*-
"""
Check what bed types exist and their slugs
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

def check_bed_types():
    """Check all bed types"""
    try:
        response = requests.get(
            f"{BASE_URL}/bed-types/",
            params={"organization": ORGANIZATION_ID},
            headers=headers
        )
        
        if response.status_code == 200:
            bed_types = response.json()
            print(f"[SUCCESS] Found {len(bed_types)} bed types:\n")
            
            for bt in bed_types:
                print(f"  ID: {bt.get('id'):3} | Name: {bt.get('name'):15} | Slug: {bt.get('slug'):15} | Capacity: {bt.get('capacity')}")
            
            return bed_types
        else:
            print(f"[ERROR] Failed to fetch bed types: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        return []

if __name__ == "__main__":
    print("=" * 80)
    print("CHECKING BED TYPES")
    print("=" * 80)
    print()
    
    check_bed_types()
