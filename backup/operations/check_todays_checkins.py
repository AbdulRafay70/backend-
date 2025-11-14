#!/usr/bin/env python3
"""
Script to check today's hotel check-ins
"""

import requests
import json
from datetime import date

BASE_URL = "http://localhost:8000"

def get_token(username, password):
    """Get JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/token/",
        json={"username": username, "password": password}
    )
    
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def get_todays_checkins(token):
    """Get today's check-ins"""
    today = str(date.today())
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Method 1: Get all today's operations
    print("\n" + "="*60)
    print(f"📅 ALL OPERATIONS FOR {today}")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/daily/hotels/?date={today}",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        
        if 'hotels' in data:
            # Grouped response
            print(f"\n✅ Found {len(data['hotels'])} hotel bookings\n")
            
            total_pax = 0
            for hotel_group in data['hotels']:
                print(f"🏨 Hotel: {hotel_group['hotel_name']} ({hotel_group['city']})")
                print(f"   Booking: {hotel_group['booking_id']}")
                print(f"   Contact: {hotel_group['contact_no_of_family_head']}")
                print(f"   Passengers:")
                
                for pax in hotel_group['pax_list']:
                    total_pax += 1
                    status_icon = "✅" if pax['status'] == 'checked_in' else "⏳"
                    print(f"      {status_icon} {pax['pax_first_name']} {pax['pax_last_name']}")
                    print(f"         Room: {pax.get('room_no', 'N/A')}, Bed: {pax.get('bed_no', 'N/A')}")
                    print(f"         Check-in: {pax['check_in_date']}, Check-out: {pax['check_out_date']}")
                    print(f"         Status: {pax['status']}")
                print()
            
            print(f"📊 Total passengers: {total_pax}")
        else:
            # Flat list response
            operations = data if isinstance(data, list) else []
            print(f"\n✅ Found {len(operations)} operations\n")
            
            for op in operations:
                status_icon = "✅" if op['status'] == 'checked_in' else "⏳"
                print(f"{status_icon} {op['pax_first_name']} {op['pax_last_name']}")
                print(f"   Booking: {op['booking_id_str']}")
                print(f"   Hotel: {op['hotel_name']} ({op['city']})")
                print(f"   Room: {op.get('room_no', 'N/A')}, Bed: {op.get('bed_no', 'N/A')}")
                print(f"   Check-in: {op['check_in_date']}, Check-out: {op['check_out_date']}")
                print(f"   Status: {op['status']}")
                print()
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
    
    # Method 2: Get only check-ins (type=checkin)
    print("\n" + "="*60)
    print(f"📅 CHECK-INS ONLY FOR {today}")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/daily/hotels/?date={today}&type=checkin",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        
        if 'hotels' in data:
            checkins = sum(len(h['pax_list']) for h in data['hotels'])
            print(f"\n✅ Today's check-ins: {checkins} passengers")
        else:
            operations = data if isinstance(data, list) else []
            print(f"\n✅ Today's check-ins: {len(operations)} operations")
    
    # Method 3: Get statistics
    print("\n" + "="*60)
    print("📊 STATISTICS")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/api/daily/hotels/statistics/",
        headers=headers
    )
    
    if response.status_code == 200:
        stats = response.json()
        print("\n✅ Overall Statistics:")
        
        if 'by_status' in stats:
            for status, count in stats['by_status'].items():
                print(f"   {status}: {count}")
        
        if 'by_date' in stats:
            print("\n   By Date:")
            for date_stat in stats['by_date']:
                print(f"   {date_stat['date']}: {date_stat['count']} operations")
        
        if 'by_hotel' in stats:
            print("\n   By Hotel:")
            for hotel_stat in stats['by_hotel']:
                print(f"   {hotel_stat['hotel_name']}: {hotel_stat['count']} operations")
    
    print("\n" + "="*60)

def main():
    # Login
    print("🔐 Logging in...")
    username = input("Enter username (or press Enter for 'admin'): ").strip() or "admin"
    password = input("Enter password: ").strip()
    
    if not password:
        print("❌ Password required!")
        return
    
    token = get_token(username, password)
    
    if token:
        print("✅ Login successful!")
        get_todays_checkins(token)
    else:
        print("❌ Login failed!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
