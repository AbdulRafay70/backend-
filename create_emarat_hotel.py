"""
Script to create Emarat Hotel in Dubai with complete bed type pricing data
This demonstrates the pivot table functionality with all bed types and 2 price periods
"""

import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000/api"
ORGANIZATION_ID = 11  # Organization ID

# You'll need to get a valid JWT token first
# Replace this with your actual JWT token
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk2NTYwOTg0LCJpYXQiOjE3NjUwMjQ5ODQsImp0aSI6ImNiMWMwZDM1OWNlMTRhNzc5NjE2NzEzNWY3MmY2YzU4IiwidXNlcl9pZCI6MzV9.5f5D7m0bcIIKqZcWP_cARTFAfOTXimR5I0eKq0mD0TA"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def create_bed_types():
    """Create all bed types if they don't exist"""
    bed_types = [
        {"name": "Single", "capacity": 1},
        {"name": "Sharing", "capacity": 2},
        {"name": "Double", "capacity": 2},
        {"name": "Triple", "capacity": 3},
        {"name": "Quad", "capacity": 4},
        {"name": "Quint", "capacity": 5},
    ]
    
    created_types = {}
    for bed_type in bed_types:
        try:
            response = requests.post(
                f"{BASE_URL}/bed-types/",
                params={"organization": ORGANIZATION_ID},
                headers=headers,
                json=bed_type
            )
            if response.status_code in [200, 201]:
                created_types[bed_type["name"].lower()] = response.json()
                print(f"✅ Created bed type: {bed_type['name']}")
            else:
                print(f"⚠️  Bed type {bed_type['name']} might already exist or error: {response.text}")
        except Exception as e:
            print(f"❌ Error creating bed type {bed_type['name']}: {e}")
    
    return created_types

def create_hotel_category():
    """Create 5 Star category if it doesn't exist"""
    category_data = {
        "name": "5 Star",
        "slug": "5-star"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/hotel-categories/",
            params={"organization": ORGANIZATION_ID},
            headers=headers,
            json=category_data
        )
        if response.status_code in [200, 201]:
            print(f"✅ Created category: 5 Star")
            return response.json()
        else:
            print(f"⚠️  Category might already exist: {response.text}")
            # Try to get existing category
            response = requests.get(
                f"{BASE_URL}/hotel-categories/",
                params={"organization": ORGANIZATION_ID},
                headers=headers
            )
            categories = response.json()
            for cat in categories:
                if cat.get('name') == '5 Star':
                    return cat
    except Exception as e:
        print(f"❌ Error creating category: {e}")
    
    return None

def get_dubai_city_id():
    """Get Dubai city ID from the database"""
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
                    print(f"✅ Found Dubai city with ID: {city['id']}")
                    return city['id']
        print("⚠️  Dubai city not found, you may need to create it first")
    except Exception as e:
        print(f"❌ Error getting cities: {e}")
    
    return None

def create_emarat_hotel():
    """Create Emarat Hotel with complete data"""
    
    print("\n🏨 Creating Emarat Hotel in Dubai...\n")
    
    # Step 1: Create bed types
    print("Step 1: Creating bed types...")
    bed_types = create_bed_types()
    
    # Step 2: Create category
    print("\nStep 2: Creating hotel category...")
    category = create_hotel_category()
    
    # Step 3: Get Dubai city ID
    print("\nStep 3: Getting Dubai city ID...")
    city_id = get_dubai_city_id()
    
    if not city_id:
        print("❌ Cannot proceed without Dubai city ID")
        return
    
    # Step 4: Create hotel with complete data
    print("\nStep 4: Creating Emarat Hotel...")
    
    hotel_data = {
        "name": "Emarat Hotel",
        "city": city_id,
        "address": "Sheikh Zayed Road, Dubai, UAE",
        "google_location": "https://maps.google.com/?q=Sheikh+Zayed+Road+Dubai",
        "contact_number": "+971-4-123-4567",
        "category": category['id'] if category else None,
        "distance": "2",
        "walking_time": "25",
        "walking_distance": "2000",
        "is_active": True,
        "available_start_date": "2025-12-15",
        "available_end_date": "2026-01-05",
        
        # Contact details
        "contact_details": [
            {
                "contact_person": "Ahmed Al Maktoum",
                "contact_number": "+971-4-123-4567"
            }
        ],
        
        # Price sections with 2 periods
        "prices": [
            # Price Period 1: Dec 15 - Dec 25
            {
                "start_date": "2025-12-15",
                "end_date": "2025-12-25",
                "room_type": "room",
                "price": 1500,  # Room price (selling)
                "selling_price": 1500,
                "purchase_price": 1200,
                "is_sharing_allowed": False
            },
            # Bed-specific prices for Period 1
            {
                "start_date": "2025-12-15",
                "end_date": "2025-12-25",
                "room_type": "single",
                "price": 1800,
                "selling_price": 1800,
                "purchase_price": 1400,
                "is_sharing_allowed": False
            },
            {
                "start_date": "2025-12-15",
                "end_date": "2025-12-25",
                "room_type": "sharing",
                "price": 1400,
                "selling_price": 1400,
                "purchase_price": 1100,
                "is_sharing_allowed": True
            },
            {
                "start_date": "2025-12-15",
                "end_date": "2025-12-25",
                "room_type": "double",
                "price": 2000,
                "selling_price": 2000,
                "purchase_price": 1600,
                "is_sharing_allowed": False
            },
            {
                "start_date": "2025-12-15",
                "end_date": "2025-12-25",
                "room_type": "triple",
                "price": 2500,
                "selling_price": 2500,
                "purchase_price": 2000,
                "is_sharing_allowed": False
            },
            {
                "start_date": "2025-12-15",
                "end_date": "2025-12-25",
                "room_type": "quad",
                "price": 3000,
                "selling_price": 3000,
                "purchase_price": 2400,
                "is_sharing_allowed": False
            },
            {
                "start_date": "2025-12-15",
                "end_date": "2025-12-25",
                "room_type": "quint",
                "price": 3500,
                "selling_price": 3500,
                "purchase_price": 2800,
                "is_sharing_allowed": False
            },
            
            # Price Period 2: Dec 26 - Jan 5
            {
                "start_date": "2025-12-26",
                "end_date": "2026-01-05",
                "room_type": "room",
                "price": 2000,  # Room price (selling)
                "selling_price": 2000,
                "purchase_price": 1600,
                "is_sharing_allowed": False
            },
            # Bed-specific prices for Period 2
            {
                "start_date": "2025-12-26",
                "end_date": "2026-01-05",
                "room_type": "single",
                "price": 2200,
                "selling_price": 2200,
                "purchase_price": 1800,
                "is_sharing_allowed": False
            },
            {
                "start_date": "2025-12-26",
                "end_date": "2026-01-05",
                "room_type": "sharing",
                "price": 1800,
                "selling_price": 1800,
                "purchase_price": 1400,
                "is_sharing_allowed": True
            },
            {
                "start_date": "2025-12-26",
                "end_date": "2026-01-05",
                "room_type": "double",
                "price": 2500,
                "selling_price": 2500,
                "purchase_price": 2000,
                "is_sharing_allowed": False
            },
            {
                "start_date": "2025-12-26",
                "end_date": "2026-01-05",
                "room_type": "triple",
                "price": 3000,
                "selling_price": 3000,
                "purchase_price": 2400,
                "is_sharing_allowed": False
            },
            {
                "start_date": "2025-12-26",
                "end_date": "2026-01-05",
                "room_type": "quad",
                "price": 3500,
                "selling_price": 3500,
                "purchase_price": 2800,
                "is_sharing_allowed": False
            },
            {
                "start_date": "2025-12-26",
                "end_date": "2026-01-05",
                "room_type": "quint",
                "price": 4000,
                "selling_price": 4000,
                "purchase_price": 3200,
                "is_sharing_allowed": False
            }
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
            print(f"\n✅ Successfully created Emarat Hotel!")
            print(f"Hotel ID: {hotel.get('id')}")
            print(f"Hotel Name: {hotel.get('name')}")
            print(f"\n📊 Pivot Table Preview:")
            print("=" * 80)
            print("| Start Date | End Date   | Room     | Single   | Sharing  | Double   | Triple   | Quad     | Quint    |")
            print("|------------|------------|----------|----------|----------|----------|----------|----------|----------|")
            print("| 2025-12-15 | 2025-12-25 | 1500 SAR | 1800 SAR | 1400 SAR | 2000 SAR | 2500 SAR | 3000 SAR | 3500 SAR |")
            print("| 2025-12-26 | 2026-01-05 | 2000 SAR | 2200 SAR | 1800 SAR | 2500 SAR | 3000 SAR | 3500 SAR | 4000 SAR |")
            print("=" * 80)
            print("\n🎉 Now go to the Hotel Availability Manager and click 'Show Prices' to see the pivot table!")
            
            return hotel
        else:
            print(f"❌ Error creating hotel: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating hotel: {e}")
        return None

if __name__ == "__main__":
    print("=" * 80)
    print("EMARAT HOTEL CREATION SCRIPT")
    print("=" * 80)
    print("\n⚠️  IMPORTANT: Update JWT_TOKEN and ORGANIZATION_ID before running!")
    print("\nTo get your JWT token:")
    print("1. Log in to the application")
    print("2. Open browser DevTools (F12)")
    print("3. Go to Application > Local Storage")
    print("4. Copy the 'access' token value")
    print("5. Paste it in this script as JWT_TOKEN")
    print("\n" + "=" * 80 + "\n")
    
    
    # Create the hotel
    create_emarat_hotel()
    
    print("\n💡 After updating the token, uncomment the last line and run:")
    print("   python create_emarat_hotel.py")
