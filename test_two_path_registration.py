"""
Test two-path universal registration.
Test 1: Authenticated admin creates organization → Should go to Organization table
Test 2: Unauthenticated creates organization → Should go to UniversalRegistration table
"""
import requests

BASE_URL = "http://127.0.0.1:8000"

print("=" * 80)
print("TESTING TWO-PATH UNIVERSAL REGISTRATION")
print("=" * 80)

# Test 1: Login as admin
print("\n[TEST 1] Admin creates organization (should save to Organization table)")
login_response = requests.post(f"{BASE_URL}/api/token/", json={
    "email": "abdulrafay@gmail.com",
    "password": "admin123"
})

if login_response.status_code == 200:
    token = login_response.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create organization as authenticated admin
    org_data = {
        "type": "organization",
        "name": "Admin Created Org",
        "email": "admincreated@example.com",
        "phone": "03001234567",
        "address": "Admin Address"
    }
    
    response = requests.post(f"{BASE_URL}/api/universal/", json=org_data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
else:
    print(f"✗ Login failed: {login_response.status_code}")

# Test 2: Create without authentication
print("\n[TEST 2] External user creates organization (should save to UniversalRegistration table)")
org_data2 = {
    "type": "organization",
    "name": "External Created Org",
    "email": "externalcreated@example.com",
    "phone": "03009876543",  
    "address": "External Address"
}

response2 = requests.post(f"{BASE_URL}/api/universal/", json=org_data2)
print(f"Status: {response2.status_code}")
print(f"Response: {response2.json()}")

print("\n" + "=" * 80)
print("VERIFICATION:")
print("  - Check Django admin Organization table for 'Admin Created Org'")
print("  - Check Django admin Universal registrations for 'External Created Org'")
print("=" * 80)
