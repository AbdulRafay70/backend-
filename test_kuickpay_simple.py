"""
Simple Kuickpay API Test Script
Tests both bill inquiry and bill payment endpoints
"""
import os
import sys
import django
from datetime import datetime
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def print_separator(title=""):
    print("\n" + "=" * 60)
    if title:
        print(title)
        print("=" * 60)

def get_token():
    """Get JWT token for the user"""
    print_separator("STEP 1: Getting Authentication Token")
    
    try:
        user = User.objects.get(email="abdulrafay@gmail.com")
        refresh = RefreshToken.for_user(user)
        token = str(refresh.access_token)
        
        print(f"[OK] Successfully obtained token for: {user.email}")
        print(f"Token: {token[:30]}...")
        return token
    except User.DoesNotExist:
        print("[ERROR] User not found: abdulrafay@gmail.com")
        return None
    except Exception as e:
        print(f"[ERROR] Error getting token: {str(e)}")
        return None

def test_bill_inquiry(client, token):
    """Test Bill Inquiry API"""
    print_separator("STEP 2: Testing Bill Inquiry API")
    
    url = "/api/kuickpay/bill-inquiry/"
    params = {
        "consumer_number": "0000812345",
        "bank_mnemonic": "KPY",
        "reserved": ""
    }
    
    print(f"\nRequest: GET {url}")
    print(f"Query Parameters:")
    print(json.dumps(params, indent=2))
    
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    response = client.get(url, params)
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Body:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.content.decode() if response.content else "No content")
    
    if response.status_code == 200:
        print("\n[OK] Bill Inquiry successful!")
        return True
    else:
        print("\n[ERROR] Bill Inquiry failed!")
        return False

def test_bill_payment(client, token):
    """Test Bill Payment API"""
    print_separator("STEP 3: Testing Bill Payment API")
    
    url = "/api/kuickpay/bill-payment/"
    
    # Get current date and time
    now = datetime.now()
    tran_date = now.strftime("%Y%m%d")
    tran_time = now.strftime("%H%M%S")
    
    payload = {
        "consumer_number": "0000812345",
        "tran_auth_id": "AUTH123456",
        "transaction_amount": "1869.00",
        "tran_date": tran_date,
        "tran_time": tran_time,
        "bank_mnemonic": "KPY",
        "reserved": ""
    }
    
    print(f"\nRequest: POST {url}")
    print(f"Request Body:")
    print(json.dumps(payload, indent=2))
    
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    response = client.post(url, payload, format='json')
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Body:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.content.decode())
    
    if response.status_code == 200:
        print("\n[OK] Bill Payment successful!")
        return True
    else:
        print("\n[ERROR] Bill Payment failed!")
        return False

def main():
    """Main test function"""
    print("\nStarting Kuickpay API Tests")
    print("=" * 60)
    
    # Initialize API client
    client = APIClient()
    
    # Step 1: Get authentication token
    token = get_token()
    if not token:
        print("\n[ERROR] Cannot proceed without authentication token!")
        return
    
    # Step 2: Test Bill Inquiry
    inquiry_success = test_bill_inquiry(client, token)
    
    # Step 3: Test Bill Payment
    payment_success = test_bill_payment(client, token)
    
    # Summary
    print_separator("TEST SUMMARY")
    print(f"[OK] Authentication: PASSED")
    print(f"[{'OK' if inquiry_success else 'ERROR'}] Bill Inquiry: {'PASSED' if inquiry_success else 'FAILED'}")
    print(f"[{'OK' if payment_success else 'ERROR'}] Bill Payment: {'PASSED' if payment_success else 'FAILED'}")
    print("=" * 60)
    
    print("\nNOTES:")
    print("- The Kuickpay BASE_URL is configured as: http://localhost:8000/pay")
    print("- This is a mock/test endpoint")
    print("- The actual Kuickpay service needs to be running at that URL")
    print("- You may see connection errors if the Kuickpay service is not available")
    print()

if __name__ == "__main__":
    main()
