"""
Simple Manual API Test Script
Run this after starting the server to test Hotel Operations API
"""

import requests
import json
from datetime import date, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# You need to get a JWT token first by logging in
# Replace with your actual token after authentication
JWT_TOKEN = "YOUR_JWT_TOKEN_HERE"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def print_response(response, title):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Text: {response.text}")
    print(f"{'='*60}\n")

def test_get_today_hotels():
    """Test GET /api/daily/hotels/?date=TODAY"""
    today = date.today().strftime('%Y-%m-%d')
    url = f"{API_BASE}/daily/hotels/?date={today}"
    
    response = requests.get(url, headers=headers)
    print_response(response, f"TEST 1: Get Hotels for {today}")
    return response

def test_get_checkins_today():
    """Test GET /api/daily/hotels/?date=TODAY&type=checkin"""
    today = date.today().strftime('%Y-%m-%d')
    url = f"{API_BASE}/daily/hotels/?date={today}&type=checkin"
    
    response = requests.get(url, headers=headers)
    print_response(response, f"TEST 2: Get Check-ins for {today}")
    return response

def test_get_checkouts_today():
    """Test GET /api/daily/hotels/?date=TODAY&type=checkout"""
    today = date.today().strftime('%Y-%m-%d')
    url = f"{API_BASE}/daily/hotels/?date={today}&type=checkout"
    
    response = requests.get(url, headers=headers)
    print_response(response, f"TEST 3: Get Check-outs for {today}")
    return response

def test_update_status(operation_id, new_status):
    """Test PUT /api/daily/hotels/update-status/"""
    url = f"{API_BASE}/daily/hotels/update-status/"
    data = {
        "operation_id": operation_id,
        "status": new_status,
        "notes": f"Updated via test script to {new_status}"
    }
    
    response = requests.put(url, headers=headers, json=data)
    print_response(response, f"TEST 4: Update Status to {new_status}")
    return response

def test_filter_by_booking(booking_id):
    """Test GET /api/daily/hotels/?booking_id=X"""
    url = f"{API_BASE}/daily/hotels/?booking_id={booking_id}"
    
    response = requests.get(url, headers=headers)
    print_response(response, f"TEST 5: Filter by Booking ID: {booking_id}")
    return response

def test_filter_by_status(status):
    """Test GET /api/daily/hotels/?status=X"""
    url = f"{API_BASE}/daily/hotels/?status={status}&grouped=false"
    
    response = requests.get(url, headers=headers)
    print_response(response, f"TEST 6: Filter by Status: {status}")
    return response

def test_statistics():
    """Test GET /api/daily/hotels/statistics/"""
    url = f"{API_BASE}/daily/hotels/statistics/"
    
    response = requests.get(url, headers=headers)
    print_response(response, "TEST 7: Get Statistics")
    return response

def test_date_range():
    """Test date range filtering"""
    today = date.today()
    week_ago = (today - timedelta(days=7)).strftime('%Y-%m-%d')
    tomorrow = (today + timedelta(days=1)).strftime('%Y-%m-%d')
    
    url = f"{API_BASE}/daily/hotels/?date_after={week_ago}&date_before={tomorrow}&grouped=false"
    
    response = requests.get(url, headers=headers)
    print_response(response, f"TEST 8: Date Range ({week_ago} to {tomorrow})")
    return response

def run_all_tests():
    """Run all API tests"""
    print("\n" + "="*60)
    print("HOTEL OPERATIONS API - MANUAL TEST SUITE")
    print("="*60)
    
    # Check if token is set
    if JWT_TOKEN == "YOUR_JWT_TOKEN_HERE":
        print("\n❌ ERROR: Please set your JWT_TOKEN in the script first!")
        print("   1. Login to get token: POST /api/token/")
        print("   2. Copy access token")
        print("   3. Set JWT_TOKEN variable in this script")
        return
    
    try:
        # Run tests
        test_get_today_hotels()
        test_get_checkins_today()
        test_get_checkouts_today()
        test_filter_by_status('pending')
        test_statistics()
        test_date_range()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED!")
        print("="*60)
        print("\nNote: Update status test requires operation_id.")
        print("Check response from first test to get an operation_id.")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to server!")
        print("   Make sure Django server is running: python manage.py runserver")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    # Quick test to check if server is running
    try:
        response = requests.get(BASE_URL)
        print(f"✅ Server is running at {BASE_URL}")
    except:
        print(f"❌ Server is NOT running at {BASE_URL}")
        print("   Start server first: python manage.py runserver")
        exit(1)
    
    run_all_tests()
