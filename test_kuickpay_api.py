"""
Test script for Kuickpay APIs
This script tests both bill inquiry and bill payment endpoints
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"

# Test credentials - update these with valid credentials from your database
TEST_EMAIL = "admin@gmail.com"
TEST_PASSWORD = "admin@123"

def get_auth_token():
    """Get JWT authentication token"""
    print("=" * 60)
    print("STEP 1: Getting Authentication Token")
    print("=" * 60)
    
    url = f"{BASE_URL}/api/token/"
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    print(f"\n📤 Request URL: {url}")
    print(f"📤 Request Body: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload)
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"📥 Response Body: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            token = response.json().get('access')
            print(f"\n✅ Successfully obtained token!")
            return token
        else:
            print(f"\n❌ Failed to get token!")
            return None
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return None


def test_bill_inquiry(token):
    """Test the Bill Inquiry API"""
    print("\n\n" + "=" * 60)
    print("STEP 2: Testing Bill Inquiry API")
    print("=" * 60)
    
    url = f"{BASE_URL}/api/kuickpay/bill-inquiry/"
    params = {
        "consumer_number": "0000812345",
        "bank_mnemonic": "KPY",
        "reserved": ""
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n📤 Request URL: {url}")
    print(f"📤 Query Parameters: {json.dumps(params, indent=2)}")
    print(f"📤 Headers: Authorization: Bearer {token[:20]}...")
    
    try:
        response = requests.get(url, params=params, headers=headers)
        print(f"\n📥 Response Status: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"📥 Response Body: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📥 Response Body (raw): {response.text}")
        
        if response.status_code == 200:
            print(f"\n✅ Bill Inquiry successful!")
            return response_data if 'response_data' in locals() else None
        else:
            print(f"\n❌ Bill Inquiry failed!")
            return None
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return None


def test_bill_payment(token):
    """Test the Bill Payment API"""
    print("\n\n" + "=" * 60)
    print("STEP 3: Testing Bill Payment API")
    print("=" * 60)
    
    url = f"{BASE_URL}/api/kuickpay/bill-payment/"
    
    # Get current date and time
    now = datetime.now()
    tran_date = now.strftime("%Y%m%d")  # Format: YYYYMMDD
    tran_time = now.strftime("%H%M%S")  # Format: HHMMSS
    
    payload = {
        "consumer_number": "0000812345",
        "tran_auth_id": "AUTH123456",
        "transaction_amount": "1869.00",
        "tran_date": tran_date,
        "tran_time": tran_time,
        "bank_mnemonic": "KPY",
        "reserved": ""
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n📤 Request URL: {url}")
    print(f"📤 Request Body: {json.dumps(payload, indent=2)}")
    print(f"📤 Headers: Authorization: Bearer {token[:20]}...")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"\n📥 Response Status: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"📥 Response Body: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📥 Response Body (raw): {response.text}")
        
        if response.status_code == 200:
            print(f"\n✅ Bill Payment successful!")
            return response_data if 'response_data' in locals() else None
        else:
            print(f"\n❌ Bill Payment failed!")
            return None
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return None


def main():
    """Main test function"""
    print("\n🚀 Starting Kuickpay API Tests")
    print("=" * 60)
    
    # Step 1: Get authentication token
    token = get_auth_token()
    if not token:
        print("\n❌ Cannot proceed without authentication token!")
        print("Please check your credentials and try again.")
        return
    
    # Step 2: Test Bill Inquiry
    inquiry_result = test_bill_inquiry(token)
    
    # Step 3: Test Bill Payment
    payment_result = test_bill_payment(token)
    
    # Summary
    print("\n\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"✅ Authentication: {'PASSED' if token else 'FAILED'}")
    print(f"{'✅' if inquiry_result else '❌'} Bill Inquiry: {'PASSED' if inquiry_result else 'FAILED'}")
    print(f"{'✅' if payment_result else '❌'} Bill Payment: {'PASSED' if payment_result else 'FAILED'}")
    print("=" * 60)
    
    print("\n\n📝 NOTES:")
    print("- The Kuickpay BASE_URL is configured as: http://localhost:8000/pay")
    print("- This appears to be a mock/test endpoint")
    print("- If you see connection errors, you may need to:")
    print("  1. Create a mock Kuickpay endpoint at /pay/api/v1/BillInquiry and /pay/api/v1/BillPayment")
    print("  2. Or update KUICKPAY_CONFIG in settings.py with the real Kuickpay URL")
    print("  3. The actual Kuickpay service needs to be running and accessible")


if __name__ == "__main__":
    main()
