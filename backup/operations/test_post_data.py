#!/usr/bin/env python3
"""
Quick Test Script for Hotel Operations API
Run this to test creating hotel operations
"""

import requests
import json
from datetime import date, timedelta

BASE_URL = "http://localhost:8000"

def test_hotel_operation_api():
    print("="*60)
    print("HOTEL OPERATIONS API - QUICK TEST")
    print("="*60)
    
    # Step 1: Get Token
    print("\n1️⃣ Getting JWT Token...")
    
    # CHANGE THESE TO YOUR CREDENTIALS
    username = input("Enter username (or press Enter for 'admin'): ").strip() or "admin"
    password = input("Enter password: ").strip()
    
    if not password:
        print("❌ Password required!")
        return
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/token/",
            json={"username": username, "password": password}
        )
        
        if response.status_code == 200:
            token = response.json()['access']
            print("✅ Token obtained successfully!")
        else:
            print(f"❌ Login failed: {response.text}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server!")
        print("   Make sure server is running: python manage.py runserver")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Check existing data
    print("\n2️⃣ Checking existing data...")
    
    # Check if we have bookings
    try:
        response = requests.get(f"{BASE_URL}/api/daily/hotels/", headers=headers)
        if response.status_code == 200:
            print(f"✅ API is accessible")
            print(f"   Current operations count: {len(response.json())}")
        else:
            print(f"⚠️ API returned: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Step 3: Create Hotel Operation
    print("\n3️⃣ Creating Hotel Operation...")
    print("\n   Enter operation details (or press Enter for defaults):")
    
    today = date.today()
    checkout = today + timedelta(days=3)
    
    operation_data = {
        "booking": int(input("   Booking ID [1]: ").strip() or "1"),
        "pax": int(input("   Pax ID [1]: ").strip() or "1"),
        "pax_id_str": input("   Pax ID String [PAX001]: ").strip() or "PAX001",
        "pax_first_name": input("   First Name [Ali]: ").strip() or "Ali",
        "pax_last_name": input("   Last Name [Raza]: ").strip() or "Raza",
        "booking_id_str": input("   Booking ID String [BKG-101]: ").strip() or "BKG-101",
        "contact_no": input("   Contact [+92300-0709017]: ").strip() or "+92300-0709017",
        "family_head_contact": input("   Family Head Contact [+92300-0709017]: ").strip() or "+92300-0709017",
        "hotel": int(input("   Hotel ID [1]: ").strip() or "1"),
        "hotel_name": input("   Hotel Name [Hilton Makkah]: ").strip() or "Hilton Makkah",
        "city": input("   City [Makkah]: ").strip() or "Makkah",
        "date": input(f"   Date [{today}]: ").strip() or str(today),
        "check_in_date": input(f"   Check-in Date [{today}]: ").strip() or str(today),
        "check_out_date": input(f"   Check-out Date [{checkout}]: ").strip() or str(checkout),
        "status": "pending"
    }
    
    # Optional fields
    room = input("   Room ID (optional, press Enter to skip): ").strip()
    if room:
        operation_data["room"] = int(room)
        operation_data["room_no"] = input("   Room Number: ").strip() or "204"
        operation_data["bed_no"] = input("   Bed Number: ").strip() or "B1"
    
    print("\n   📤 Sending request...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/daily/hotels/",
            headers=headers,
            json=operation_data
        )
        
        if response.status_code == 201:
            print("\n✅ SUCCESS! Hotel Operation Created!")
            result = response.json()
            print(f"\n   📋 Created Operation Details:")
            print(f"   ├─ ID: {result.get('id')}")
            print(f"   ├─ Booking: {result.get('booking_id_str')}")
            print(f"   ├─ Passenger: {result.get('pax_first_name')} {result.get('pax_last_name')}")
            print(f"   ├─ Hotel: {result.get('hotel_name')} ({result.get('city')})")
            print(f"   ├─ Check-in: {result.get('check_in_date')}")
            print(f"   ├─ Check-out: {result.get('check_out_date')}")
            print(f"   └─ Status: {result.get('status')}")
            
            # Step 4: Verify by fetching
            print("\n4️⃣ Verifying creation...")
            response = requests.get(
                f"{BASE_URL}/api/daily/hotels/?date={operation_data['date']}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'hotels' in data:
                    print(f"✅ Found operation in today's list")
                    print(f"   Total operations for {operation_data['date']}: {len(data.get('hotels', []))}")
                else:
                    print(f"✅ Operation exists (found {len(data)} operations)")
            
            # Step 5: Show next steps
            print("\n" + "="*60)
            print("🎉 TEST SUCCESSFUL!")
            print("="*60)
            print("\n📍 Next Steps:")
            print(f"   1. View in Swagger: http://localhost:8000/api/schema/swagger-ui/")
            print(f"   2. View all operations: GET {BASE_URL}/api/daily/hotels/")
            print(f"   3. Update status: PUT {BASE_URL}/api/daily/hotels/update-status/")
            print(f"      Body: {{'operation_id': {result.get('id')}, 'status': 'checked_in'}}")
            print(f"   4. View today's operations: GET {BASE_URL}/api/daily/hotels/?date={today}")
            
        else:
            print(f"\n❌ FAILED to create operation")
            print(f"   Status Code: {response.status_code}")
            print(f"   Error Details:")
            try:
                errors = response.json()
                for field, messages in errors.items():
                    print(f"   ├─ {field}: {messages}")
            except:
                print(f"   └─ {response.text}")
            
            print("\n💡 Common Issues:")
            print("   • Make sure booking, pax, and hotel IDs exist in database")
            print("   • Check date format: YYYY-MM-DD")
            print("   • Verify all required fields are provided")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("   Make sure the server is running!")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    try:
        test_hotel_operation_api()
    except KeyboardInterrupt:
        print("\n\n👋 Test cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
