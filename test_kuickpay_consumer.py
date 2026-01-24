"""
Test KuickPay Integration Endpoints

This script demonstrates how to test the bill inquiry and payment endpoints
using the consumer numbers generated in your admin panel.
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_bill_inquiry(consumer_number):
    """Test bill inquiry endpoint"""
    url = f"{BASE_URL}/api/kuickpay/bill-inquiry/"
    
    payload = {
        "consumer_number": consumer_number,
        "bank_mnemonic": "TEST_BANK"
    }
    
    print(f"\n{'='*60}")
    print(f"TESTING BILL INQUIRY")
    print(f"{'='*60}")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(url, json=payload)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    
    return response.json()


def test_bill_payment(consumer_number, amount):
    """Test bill payment endpoint"""
    url = f"{BASE_URL}/api/kuickpay/bill-payment/"
    
    payload = {
        "consumer_number": consumer_number,
        "transaction_amount": str(amount),
        "tran_auth_id": "AUTH-TEST-12345",
        "bank_mnemonic": "TEST_BANK"
    }
    
    print(f"\n{'='*60}")
    print(f"TESTING BILL PAYMENT")
    print(f"{'='*60}")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(url, json=payload)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    
    return response.json()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("KUICKPAY INTEGRATION TEST")
    print("="*60)
    
    # Get consumer number from user
    consumer_number = input("\nEnter the consumer number to test (e.g., 95700000): ").strip()
    
    if not consumer_number:
        print("No consumer number provided. Exiting.")
        exit(1)
    
    # Step 1: Test Bill Inquiry
    inquiry_response = test_bill_inquiry(consumer_number)
    
    if inquiry_response.get('response_Code') == '00':
        print("\n✅ Bill inquiry successful!")
        
        # Step 2: Ask if user wants to test payment
        test_payment = input("\nDo you want to test bill payment? (y/n): ").strip().lower()
        
        if test_payment == 'y':
            amount = inquiry_response.get('bill_amount')
            payment_response = test_bill_payment(consumer_number, amount)
            
            if payment_response.get('response_Code') == '00':
                print("\n✅ Bill payment successful!")
                print(f"Transaction ID: {payment_response.get('transaction_id')}")
                print(f"Confirmation Number: {payment_response.get('confirmation_number')}")
            else:
                print(f"\n❌ Bill payment failed: {payment_response.get('response_Description')}")
    else:
        print(f"\n❌ Bill inquiry failed: {inquiry_response.get('response_Description')}")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")
