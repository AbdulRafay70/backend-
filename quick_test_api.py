"""Quick test of Kuickpay APIs"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

consumers = [
    "095710000000000002",
    "095710000000000003",
    "095710000000000004",
    "095710000000000005"
]

print("\nTesting Bill Inquiry API\n" + "="*60)

for num in consumers:
    url = f"{BASE_URL}/kuickpay/bill-inquiry/"
    payload = {"consumer_number": num, "bank_mnemonic": "KPY", "reserved": ""}
    
    try:
        r = requests.post(url, json=payload)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ {num} - {data.get('consumer_name')} - PKR {data.get('bill_amount')}")
        else:
            print(f"❌ {num} - Status: {r.status_code}")
    except Exception as e:
        print(f"❌ {num} - Error: {e}")

print("\n" + "="*60 + "\n")
