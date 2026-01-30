
import os
import django
import json
import requests
from django.test import Client

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from payments.models import Consumer
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

# Force ALLOWED_HOSTS for testing
settings.ALLOWED_HOSTS += ['testserver']

def test_bill_inquiry():
    print("--- [TEST] Testing Kuickpay Bill Inquiry ---")
    
    # 1. Get or Create a Consumer
    consumer = Consumer.objects.first()
    if not consumer:
        print("[WARN] No consumer found. Creating a test consumer...")
        consumer = Consumer.objects.create(
            consumer_number="12345678901234567890",
            consumer_name="Test User",
            amount=5000.00,
            expiry_date=timezone.now().date() + timedelta(days=30),
            bill_status='U', # Unpaid
            email_address="test@example.com",
            contact_number="03001234567",
            reason="Test Bill"
        )
        print(f"[SUCCESS] Created test consumer: {consumer.consumer_number}")
    else:
        print(f"[INFO] Found existing consumer: {consumer.consumer_number}")
        
    # 2. Prepare Request Payload
    payload = {
        "consumer_number": consumer.consumer_number,
        "bank_mnemonic": "BAHL" # Bank Al Habib (Example)
    }
    
    print(f"\n[OUT] Sending Request to /api/kuickpay/bill-inquiry/")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    # 3. Execute Request using Django Client (direct view test)
    c = Client()
    response = c.post(
        '/api/kuickpay/bill-inquiry/',
        data=payload,
        content_type='application/json'
    )
    
    # 4. Print Response
    print(f"\n[IN] Response Code: {response.status_code}")
    try:
        data = response.json()
        print(f"Response Body:\n{json.dumps(data, indent=2)}")
        
        if response.status_code == 200 and data.get('response_Code') == '00':
            print("\n[PASS] TEST PASSED: Successful Bill Inquiry")
        else:
            print("\n[FAIL] TEST FAILED: Verification failed")
            
    except Exception as e:
        print(f"[FAIL] Failed to parse response: {e}")
        print(response.content)

if __name__ == "__main__":
    test_bill_inquiry()
