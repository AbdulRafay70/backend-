"""
Test Kuickpay APIs with Real Consumer Numbers

Tests both bill-inquiry and bill-payment endpoints with actual consumer data.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
BANK_MNEMONIC = "KPY"

# Test consumers (18-digit format)
TEST_CONSUMERS = [
    {"number": "095710000000000002", "name": "Fatima Khan"},
    {"number": "095710000000000003", "name": "Ali Hassan"},
    {"number": "095710000000000004", "name": "Ayesha Malik"},
    {"number": "095710000000000005", "name": "Usman Farooq"},
]


def test_bill_inquiry(consumer_number, consumer_name):
    """Test Bill Inquiry API"""
    url = f"{BASE_URL}/kuickpay/bill-inquiry/"
    
    payload = {
        "consumer_number": consumer_number,
        "bank_mnemonic": BANK_MNEMONIC,
        "reserved": ""
    }
    
    print(f"\n{'='*90}")
    print(f"BILL INQUIRY: {consumer_name} ({consumer_number})")
    print(f"{'='*90}")
    print(f"URL: POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ SUCCESS!")
            print(json.dumps(data, indent=2))
            return True, data
        else:
            print(f"\n❌ FAILED!")
            try:
                error = response.json()
                print(json.dumps(error, indent=2))
            except:
                print(response.text)
            return False, None
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Cannot connect to {BASE_URL}")
        print("Make sure Django server is running!")
        return False, None
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False, None


def test_bill_payment(consumer_number, consumer_name, amount):
    """Test Bill Payment API"""
    url = f"{BASE_URL}/kuickpay/bill-payment/"
    
    payload = {
        "consumer_number": consumer_number,
        "tran_auth_id": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "transaction_amount": str(amount),
        "tran_date": datetime.now().strftime("%Y%m%d"),
        "tran_time": datetime.now().strftime("%H%M%S"),
        "bank_mnemonic": BANK_MNEMONIC,
        "reserved": ""
    }
    
    print(f"\n{'='*90}")
    print(f"BILL PAYMENT: {consumer_name} ({consumer_number})")
    print(f"{'='*90}")
    print(f"URL: POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ SUCCESS!")
            print(json.dumps(data, indent=2))
            return True, data
        else:
            print(f"\n❌ FAILED!")
            try:
                error = response.json()
                print(json.dumps(error, indent=2))
            except:
                print(response.text)
            return False, None
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Cannot connect to {BASE_URL}")
        print("Make sure Django server is running!")
        return False, None
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False, None


def main():
    """Run all tests"""
    print("\n" + "╔" + "="*88 + "╗")
    print("║" + " "*25 + "KUICKPAY API INTEGRATION TEST" + " "*34 + "║")
    print("╚" + "="*88 + "╝")
    
    results = {
        "inquiry_success": 0,
        "inquiry_failed": 0,
        "payment_success": 0,
        "payment_failed": 0
    }
    
    for consumer in TEST_CONSUMERS:
        consumer_number = consumer["number"]
        consumer_name = consumer["name"]
        
        # Test Bill Inquiry
        success, inquiry_data = test_bill_inquiry(consumer_number, consumer_name)
        
        if success:
            results["inquiry_success"] += 1
            
            # Extract amount for payment test
            amount = inquiry_data.get("bill_amount", "0")
            
            # Test Bill Payment (only if inquiry succeeded)
            print(f"\n{'─'*90}")
            print(f"Now testing payment for {consumer_name}...")
            print(f"{'─'*90}")
            
            payment_success, payment_data = test_bill_payment(consumer_number, consumer_name, amount)
            
            if payment_success:
                results["payment_success"] += 1
            else:
                results["payment_failed"] += 1
        else:
            results["inquiry_failed"] += 1
            print(f"\n⚠️  Skipping payment test (inquiry failed)")
    
    # Summary
    print(f"\n\n{'='*90}")
    print("TEST SUMMARY")
    print(f"{'='*90}")
    print(f"\nBill Inquiry API:")
    print(f"  ✅ Success: {results['inquiry_success']}/{len(TEST_CONSUMERS)}")
    print(f"  ❌ Failed:  {results['inquiry_failed']}/{len(TEST_CONSUMERS)}")
    
    print(f"\nBill Payment API:")
    print(f"  ✅ Success: {results['payment_success']}/{len(TEST_CONSUMERS)}")
    print(f"  ❌ Failed:  {results['payment_failed']}/{len(TEST_CONSUMERS)}")
    
    total_tests = len(TEST_CONSUMERS) * 2
    total_success = results['inquiry_success'] + results['payment_success']
    
    print(f"\nOverall:")
    print(f"  Total Tests: {total_tests}")
    print(f"  Passed: {total_success}")
    print(f"  Failed: {total_tests - total_success}")
    
    if total_success == total_tests:
        print(f"\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  Some tests failed. Check details above.")
    
    print(f"{'='*90}\n")


if __name__ == '__main__':
    main()
