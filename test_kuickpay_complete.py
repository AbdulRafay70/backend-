"""
Complete test of Kuickpay APIs with JWT authentication
Tests the full flow: Login -> Get JWT -> Test Bill Inquiry -> Test Bill Payment
"""
import requests
import json
from decimal import Decimal

BASE_URL = "http://localhost:8000"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_response(response):
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

# Step 1: Login to get JWT token
print_section("STEP 1: Login to Get JWT Token")
login_url = f"{BASE_URL}/api/token/"
login_data = {
    "username": "abdulrafay@gmail.com",
    "password": "hyd12233"
}

print(f"POST {login_url}")
print(f"Body: {json.dumps(login_data, indent=2)}")

try:
    login_response = requests.post(login_url, json=login_data)
    print_response(login_response)
    
    if login_response.status_code == 200:
        jwt_token = login_response.json().get('access')
        print(f"\n✅ JWT Token obtained successfully!")
        print(f"Token (first 50 chars): {jwt_token[:50]}...")
    else:
        print(f"\n❌ Login failed!")
        exit(1)
except Exception as e:
    print(f"\n❌ Error during login: {e}")
    exit(1)

# Step 2: Test Bill Inquiry API
print_section("STEP 2: Test Bill Inquiry API")
bill_inquiry_url = f"{BASE_URL}/api/kuickpay/bill-inquiry/"
headers = {
    "Authorization": f"Bearer {jwt_token}",
    "Content-Type": "application/json"
}
params = {
    "consumer_number": "095716373739",
    "bank_mnemonic": "KPY",
    "reserved": ""
}

print(f"GET {bill_inquiry_url}")
print(f"Headers: Authorization: Bearer {jwt_token[:30]}...")
print(f"Params: {json.dumps(params, indent=2)}")

try:
    inquiry_response = requests.get(bill_inquiry_url, headers=headers, params=params)
    print_response(inquiry_response)
    
    if inquiry_response.status_code == 200:
        print(f"\n✅ Bill Inquiry successful!")
    else:
        print(f"\n❌ Bill Inquiry failed!")
except Exception as e:
    print(f"\n❌ Error during bill inquiry: {e}")

# Step 3: Test Bill Payment API
print_section("STEP 3: Test Bill Payment API")
bill_payment_url = f"{BASE_URL}/api/kuickpay/bill-payment/"
payment_data = {
    "consumer_number": "0000812345",
    "tran_auth_id": "AUTH123456",
    "transaction_amount": "1869.00",
    "tran_date": "20241215",
    "tran_time": "143022",
    "bank_mnemonic": "KPY",
    "reserved": ""
}

print(f"POST {bill_payment_url}")
print(f"Headers: Authorization: Bearer {jwt_token[:30]}...")
print(f"Body: {json.dumps(payment_data, indent=2)}")

try:
    payment_response = requests.post(bill_payment_url, headers=headers, json=payment_data)
    print_response(payment_response)
    
    if payment_response.status_code == 200:
        print(f"\n✅ Bill Payment successful!")
    else:
        print(f"\n❌ Bill Payment failed!")
except Exception as e:
    print(f"\n❌ Error during bill payment: {e}")

# Summary
print_section("TEST SUMMARY")
print(f"✅ Login: {'SUCCESS' if login_response.status_code == 200 else 'FAILED'}")
print(f"{'✅' if inquiry_response.status_code == 200 else '❌'} Bill Inquiry: {'SUCCESS' if inquiry_response.status_code == 200 else 'FAILED'}")
print(f"{'✅' if payment_response.status_code == 200 else '❌'} Bill Payment: {'SUCCESS' if payment_response.status_code == 200 else 'FAILED'}")
print("\n" + "="*60)
