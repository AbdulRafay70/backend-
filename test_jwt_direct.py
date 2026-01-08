"""
Direct HTTP test to debug JWT serializer issue.
"""
import requests
import json

url = "http://127.0.0.1:8000/api/token/"

# Test with different payloads
test_cases = [
    {
        "name": "Test 1: Email  + Password",
        "payload": {"email": "admin@example.com", "password": "admin123"}
    },
    {
        "name": "Test 2: Username (email) + Password",
        "payload": {"username": "admin@example.com", "password": "admin123"}
    },
    {
        "name": "Test 3: Username (actual) + Password",
        "payload": {"username": "admin", "password": "admin123"}
    },
    {
        "name": "Test 4: Both Email and Username + Password",
        "payload": {"email": "admin@example.com", "username": "admin", "password": "admin123"}
    },
]

print("=" * 80)
print("TESTING JWT TOKEN ENDPOINT")
print("=" * 80)

for test in test_cases:
    print(f"\n{test['name']}")
    print(f"Payload: {test['payload']}")
    
    response = requests.post(url, json=test['payload'])
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✓ SUCCESS!")
        data = response.json()
        print(f"Access token (first 30 chars): {data.get('access', '')[:30]}...")
        print(f"User: {data.get('user', {}).get('email')}")
    else:
        print(f"✗ FAILED: {response.text}")

print("\n" + "=" * 80)
