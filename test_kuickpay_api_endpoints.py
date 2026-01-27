"""
Test Kuickpay Bill Inquiry and Bill Payment APIs

This script tests the Kuickpay API endpoints to ensure they're working
with the new 18-digit consumer number format.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
TEST_CONSUMER_NUMBER = "09571000000000001"  # Muhammad Ahmed
BANK_MNEMONIC = "KPY"

# You'll need a valid JWT token - get from your admin login
# For now, we'll test without auth to see basic functionality
AUTH_TOKEN = None  # Replace with actual token if needed

def test_bill_inquiry():
    """Test the Bill Inquiry API endpoint"""
    print("=" * 80)
    print("TEST 1: BILL INQUIRY API")
    print("=" * 80)
    
    url = f"{BASE_URL}/kuickpay/bill-inquiry/"
    
    params = {
        "consumer_number": TEST_CONSUMER_NUMBER,
        "bank_mnemonic": BANK_MNEMONIC,
        "reserved": ""
    }
    
    headers = {}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    print(f"\n📤 Request:")
    print(f"   URL: GET {url}")
    print(f"   Params: {json.dumps(params, indent=6)}")
    print(f"   Consumer Number: {TEST_CONSUMER_NUMBER} ({len(TEST_CONSUMER_NUMBER)} digits)")
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Body:")
        
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=3))
            
            # Validate response
            if response.status_code == 200:
                print(f"\n✅ SUCCESS: Bill Inquiry API is working!")
                
                # Check if consumer number matches
                if 'consumer_number' in response_json:
                    returned_number = response_json['consumer_number']
                    if returned_number == TEST_CONSUMER_NUMBER:
                        print(f"✅ Consumer number matches: {returned_number}")
                    else:
                        print(f"⚠️  Consumer number mismatch:")
                        print(f"    Expected: {TEST_CONSUMER_NUMBER}")
                        print(f"    Received: {returned_number}")
                
                return True
            else:
                print(f"\n❌ FAILED: Status {response.status_code}")
                return False
                
        except json.JSONDecodeError:
            print(f"   Raw Text: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Cannot connect to {BASE_URL}")
        print(f"   Make sure Django server is running: python manage.py runserver")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False


def test_bill_payment():
    """Test the Bill Payment API endpoint"""
    print("\n\n" + "=" * 80)
    print("TEST 2: BILL PAYMENT API")
    print("=" * 80)
    
    url = f"{BASE_URL}/kuickpay/bill-payment/"
    
    payload = {
        "consumer_number": TEST_CONSUMER_NUMBER,
        "tran_auth_id": "TEST123456",
        "transaction_amount": "150000.00",
        "tran_date": datetime.now().strftime("%Y%m%d"),
        "tran_time": datetime.now().strftime("%H%M%S"),
        "bank_mnemonic": BANK_MNEMONIC,
        "reserved": ""
    }
    
    headers = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    print(f"\n📤 Request:")
    print(f"   URL: POST {url}")
    print(f"   Payload:")
    print(json.dumps(payload, indent=3))
    print(f"   Consumer Number: {TEST_CONSUMER_NUMBER} ({len(TEST_CONSUMER_NUMBER)} digits)")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Body:")
        
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=3))
            
            if response.status_code == 200:
                print(f"\n✅ SUCCESS: Bill Payment API is working!")
                return True
            else:
                print(f"\n❌ FAILED: Status {response.status_code}")
                return False
                
        except json.JSONDecodeError:
            print(f"   Raw Text: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Cannot connect to {BASE_URL}")
        print(f"   Make sure Django server is running: python manage.py runserver")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False


def test_consumer_number_format():
    """Verify consumer number format"""
    print("\n\n" + "=" * 80)
    print("TEST 3: CONSUMER NUMBER FORMAT VERIFICATION")
    print("=" * 80)
    
    print(f"\nConsumer Number: {TEST_CONSUMER_NUMBER}")
    print(f"Length: {len(TEST_CONSUMER_NUMBER)} digits")
    print(f"Prefix: {TEST_CONSUMER_NUMBER[:5]}")
    print(f"Sequence: {TEST_CONSUMER_NUMBER[5:]}")
    
    # Validation
    checks = []
    
    # Check 1: Length
    if len(TEST_CONSUMER_NUMBER) == 18:
        print(f"✅ Length: 18 digits (correct)")
        checks.append(True)
    else:
        print(f"❌ Length: {len(TEST_CONSUMER_NUMBER)} digits (should be 18)")
        checks.append(False)
    
    # Check 2: Prefix
    if TEST_CONSUMER_NUMBER.startswith("09571"):
        print(f"✅ Prefix: 09571 (correct)")
        checks.append(True)
    else:
        print(f"❌ Prefix: {TEST_CONSUMER_NUMBER[:5]} (should be 09571)")
        checks.append(False)
    
    # Check 3: All digits
    if TEST_CONSUMER_NUMBER.isdigit():
        print(f"✅ Format: All digits (correct)")
        checks.append(True)
    else:
        print(f"❌ Format: Contains non-digit characters")
        checks.append(False)
    
    return all(checks)


if __name__ == '__main__':
    print("\n" + "╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "KUICKPAY API INTEGRATION TEST" + " " * 29 + "║")
    print("╚" + "=" * 78 + "╝")
    
    # Test format first
    format_ok = test_consumer_number_format()
    
    # Test APIs
    inquiry_ok = test_bill_inquiry()
    payment_ok = test_bill_payment()
    
    # Summary
    print("\n\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"1. Consumer Number Format: {'✅ PASS' if format_ok else '❌ FAIL'}")
    print(f"2. Bill Inquiry API: {'✅ PASS' if inquiry_ok else '❌ FAIL'}")
    print(f"3. Bill Payment API: {'✅ PASS' if payment_ok else '❌ FAIL'}")
    
    if format_ok and inquiry_ok and payment_ok:
        print("\n🎉 ALL TESTS PASSED! Kuickpay integration is working correctly.")
    else:
        print("\n⚠️  SOME TESTS FAILED. Check the details above.")
    
    print("\nNote: If you get authentication errors, you need to:")
    print("1. Login to get a JWT token")
    print("2. Update AUTH_TOKEN variable in this script")
    print("=" * 80 + "\n")
