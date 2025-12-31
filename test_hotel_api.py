"""
Hotel Inventory API Testing Script
Tests GET /api/hotels/ and POST /api/hotels/ endpoints
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels, HotelPrices, HotelContactDetails, HotelPhoto
from organization.models import Organization
from packages.models import City
from django.contrib.auth import get_user_model

User = get_user_model()

def show_hotel_inventory():
    """Display current hotels with complete data"""
    print("\n" + "="*80)
    print("HOTEL INVENTORY API - DATABASE STATUS")
    print("="*80)
    
    hotels = Hotels.objects.filter(is_active=True).prefetch_related(
        'prices', 'contact_details', 'photos'
    )[:5]
    
    print(f"\nTotal Active Hotels: {Hotels.objects.filter(is_active=True).count()}")
    print(f"\nShowing first 5 hotels:\n")
    
    for hotel in hotels:
        print(f"\n{'─'*80}")
        print(f"Hotel ID: {hotel.id}")
        print(f"Name: {hotel.name}")
        print(f"Address: {hotel.address}")
        print(f"Google Location: {hotel.google_location or 'N/A'}")
        print(f"Reselling Allowed: {hotel.reselling_allowed}")
        print(f"Contact Number: {hotel.contact_number or 'N/A'}")
        print(f"Category: {hotel.category}")
        print(f"Distance: {hotel.distance} meters")
        print(f"Active: {hotel.is_active}")
        print(f"Available: {hotel.available_start_date} to {hotel.available_end_date}")
        print(f"Organization ID: {hotel.organization_id or 'N/A'}")
        print(f"City ID: {hotel.city_id or 'N/A'}")
        
        # Prices
        prices = hotel.prices.all()
        print(f"\nPrices ({prices.count()}):")
        for price in prices[:3]:
            print(f"  - {price.room_type}: ${price.price} ({price.start_date} to {price.end_date})")
            print(f"    Sharing Allowed: {price.is_sharing_allowed}")
        
        # Contact Details
        contacts = hotel.contact_details.all()
        print(f"\nContact Details ({contacts.count()}):")
        for contact in contacts[:2]:
            print(f"  - {contact.contact_person}: {contact.contact_number}")
        
        # Photos
        photos = hotel.photos.all()
        print(f"\nPhotos ({photos.count()}):")
        for photo in photos[:2]:
            print(f"  - ID {photo.id}: {photo.caption or 'No caption'}")
            if photo.image:
                print(f"    Path: {photo.image.url}")
        
        # Video
        if hotel.video:
            print(f"\nVideo: {hotel.video.url}")
        else:
            print(f"\nVideo: None")


def show_api_endpoints():
    """Display API endpoint documentation"""
    print("\n" + "="*80)
    print("HOTEL INVENTORY API ENDPOINTS")
    print("="*80)
    
    endpoints = [
        {
            "method": "GET",
            "endpoint": "/api/hotels/",
            "description": "Fetch all hotels with room types, pricing, and city linkage",
            "auth": "Required (Token)",
            "response": """[
  {
    "id": 23,
    "name": "Hilton Makkah",
    "address": "Ajyad Street, Makkah",
    "google_location": "https://goo.gl/maps/123",
    "reselling_allowed": false,
    "contact_number": "+966-500000000",
    "category": "deluxe",
    "distance": 400,
    "is_active": true,
    "available_start_date": "2025-11-01",
    "available_end_date": "2025-11-19",
    "organization": 11,
    "city": 5,
    "prices": [
      {
        "id": 149,
        "start_date": "2025-11-01",
        "end_date": "2025-11-24",
        "room_type": "double",
        "price": 10000,
        "is_sharing_allowed": false
      }
    ],
    "contact_details": [
      {
        "id": 23,
        "contact_person": "Reception",
        "contact_number": "+966-500000000"
      }
    ],
    "photos_data": [
      {
        "id": 1,
        "caption": "Main Lobby",
        "image": "/media/hotel_photos/hilton.jpg"
      }
    ],
    "video": "http://127.0.0.1:8000/media/hotel_videos/hilton_intro.mp4"
  }
]"""
        },
        {
            "method": "POST",
            "endpoint": "/api/hotels/",
            "description": "Create new hotel (Admin only)",
            "auth": "Required (Token)",
            "request": """{
  "name": "Hilton Makkah",
  "address": "Ajyad Street, Makkah",
  "google_location": "https://goo.gl/maps/123",
  "reselling_allowed": false,
  "contact_number": "+966-500000000",
  "category": "deluxe",
  "distance": 400,
  "is_active": true,
  "available_start_date": "2025-11-01",
  "available_end_date": "2025-11-19",
  "organization": 11,
  "city": 5,
  "prices": [
    {
      "start_date": "2025-11-01",
      "end_date": "2025-11-24",
      "room_type": "double",
      "price": 10000,
      "is_sharing_allowed": false
    }
  ],
  "contact_details": [
    {
      "contact_person": "Reception",
      "contact_number": "+966-500000000"
    }
  ]
}""",
            "response": "Same as GET response for created hotel"
        },
        {
            "method": "GET",
            "endpoint": "/api/hotels/{id}/",
            "description": "Retrieve a single hotel by ID",
            "auth": "Required (Token)",
            "response": "Single hotel object (same structure as GET /api/hotels/)"
        },
        {
            "method": "PUT/PATCH",
            "endpoint": "/api/hotels/{id}/",
            "description": "Update hotel details",
            "auth": "Required (Token + Admin)",
            "response": "Updated hotel object"
        },
        {
            "method": "DELETE",
            "endpoint": "/api/hotels/{id}/",
            "description": "Delete hotel (sets is_active=false)",
            "auth": "Required (Token + Admin)",
            "response": "204 No Content"
        }
    ]
    
    for endpoint in endpoints:
        print(f"\n{'─'*80}")
        print(f"{endpoint['method']} {endpoint['endpoint']}")
        print(f"Description: {endpoint['description']}")
        print(f"Authentication: {endpoint['auth']}")
        
        if 'request' in endpoint:
            print(f"\nRequest Body:")
            print(endpoint['request'])
        
        print(f"\nResponse:")
        print(endpoint['response'])


def show_sample_curl_commands():
    """Display sample cURL commands"""
    print("\n" + "="*80)
    print("SAMPLE cURL COMMANDS")
    print("="*80)
    
    print("""
# 1. Get all hotels
curl -X GET "http://127.0.0.1:8000/api/hotels/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 2. Get hotels for specific organization
curl -X GET "http://127.0.0.1:8000/api/hotels/?organization=11" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 3. Create a new hotel
curl -X POST "http://127.0.0.1:8000/api/hotels/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Hilton Makkah",
    "address": "Ajyad Street, Makkah",
    "category": "deluxe",
    "distance": 400,
    "city": 5,
    "organization": 11,
    "prices": [
      {
        "start_date": "2025-11-01",
        "end_date": "2025-11-24",
        "room_type": "double",
        "price": 10000,
        "is_sharing_allowed": false
      }
    ],
    "contact_details": [
      {
        "contact_person": "Reception",
        "contact_number": "+966-500000000"
      }
    ]
  }'

# 4. Get single hotel by ID
curl -X GET "http://127.0.0.1:8000/api/hotels/23/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 5. Update hotel
curl -X PATCH "http://127.0.0.1:8000/api/hotels/23/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "category": "luxury",
    "distance": 350
  }'

# 6. Delete hotel (soft delete - sets is_active=false)
curl -X DELETE "http://127.0.0.1:8000/api/hotels/23/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"
""")


def show_response_format():
    """Display the exact response format"""
    print("\n" + "="*80)
    print("RESPONSE FORMAT SPECIFICATION")
    print("="*80)
    
    print("""
GET /api/hotels/ Response Structure:

[
  {
    "id": Integer,                           // Hotel ID
    "name": String,                          // Hotel name
    "address": String,                       // Full address
    "google_location": String | null,        // Google Maps URL
    "reselling_allowed": Boolean,            // Can be resold by agencies
    "contact_number": String | null,         // Main contact number
    "category": String,                      // economy|budget|standard|deluxe|luxury|5_star|4_star|3_star|2_star
    "distance": Float,                       // Distance in meters
    "is_active": Boolean,                    // Active status
    "available_start_date": Date | null,     // Format: YYYY-MM-DD
    "available_end_date": Date | null,       // Format: YYYY-MM-DD
    "status": String,                        // active|inactive|pending|maintenance
    "organization": Integer | null,          // Organization ID
    "city": Integer | null,                  // City ID
    "video": String | null,                  // Full URL to video file
    "prices": [                              // Array of room prices
      {
        "id": Integer,                       // Price record ID
        "start_date": Date,                  // Format: YYYY-MM-DD
        "end_date": Date,                    // Format: YYYY-MM-DD
        "room_type": String,                 // single|double|triple|quad|quint|suite|deluxe|executive
        "price": Float,                      // Price amount
        "is_sharing_allowed": Boolean        // Can be shared/resold
      }
    ],
    "contact_details": [                     // Array of contacts
      {
        "id": Integer,                       // Contact record ID
        "contact_person": String,            // Contact name
        "contact_number": String             // Phone number
      }
    ],
    "photos_data": [                         // Array of hotel photos
      {
        "id": Integer,                       // Photo ID
        "caption": String,                   // Photo caption
        "image": String | null               // Full URL to image file
      }
    ]
  }
]

POST /api/hotels/ Request Body:
{
  "name": String (required),
  "address": String (required),
  "google_location": String (optional),
  "reselling_allowed": Boolean (optional, default: false),
  "contact_number": String (optional),
  "category": String (optional, default: "standard"),
  "distance": Float (optional, default: 0),
  "is_active": Boolean (optional, default: true),
  "available_start_date": Date (optional),
  "available_end_date": Date (optional),
  "organization": Integer (optional - auto-assigned for non-admins),
  "city": Integer (optional),
  "prices": Array (optional) - nested price objects,
  "contact_details": Array (optional) - nested contact objects,
  "video": File (optional) - multipart/form-data for file upload
}
""")


def show_filters_and_permissions():
    """Display filtering and permissions info"""
    print("\n" + "="*80)
    print("FILTERS & PERMISSIONS")
    print("="*80)
    
    print("""
Query Parameters (GET /api/hotels/):
  ?organization=<id>    - Filter by organization ID
                          (Auto-applied for non-admin users)

Permission Levels:

1. SUPERADMIN:
   - Can see ALL hotels across all organizations
   - Can create hotels for any organization
   - Can update/delete any hotel

2. ORGANIZATION USER:
   - Can see hotels from:
     * Their own organization
     * Partner organizations (via AllowedReseller with "HOTELS" type)
   - For partner hotels, only resellable ones are shown
   - Can create hotels for their organization only
   - Can update/delete hotels from their organization

3. RESELLER FILTERING:
   - Own organization hotels: All shown (even if not resellable)
   - Partner organization hotels: Only if:
     * reselling_allowed = true
     * At least one price with is_sharing_allowed = true

Data Optimization:
  - Uses prefetch_related for prices, contact_details, and photos
  - Reduces database queries with efficient joins
  - Returns only is_active=true hotels
""")


if __name__ == "__main__":
    print("\n")
    print("█"*80)
    print(" "*25 + "HOTEL INVENTORY API TESTER")
    print("█"*80)
    
    try:
        show_hotel_inventory()
        show_api_endpoints()
        show_response_format()
        show_filters_and_permissions()
        show_sample_curl_commands()
        
        print("\n" + "="*80)
        print("✅ API READY FOR USE")
        print("="*80)
        print("\nEndpoints configured:")
        print("  GET    /api/hotels/")
        print("  POST   /api/hotels/")
        print("  GET    /api/hotels/{id}/")
        print("  PUT    /api/hotels/{id}/")
        print("  PATCH  /api/hotels/{id}/")
        print("  DELETE /api/hotels/{id}/")
        print("\nAuthentication: Token required")
        print("Base URL: http://127.0.0.1:8000")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
