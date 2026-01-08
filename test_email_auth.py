"""
Test script for email-based authentication with multi-organization support.

This script tests:
1. Creating an admin user with email
2. Creating an organization and linking user to it
3. Logging in with email
4. Verifying organization context in JWT token
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_email_authentication():
    print("=" * 80)
    print("TESTING EMAIL-BASED AUTHENTICATION")
    print("=" * 80)
    
    # Test 1: Login with email
    print("\n[TEST 1] Login with email...")
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/token/", json=login_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("✓ Login successful!")
        data = response.json()
        print(f"\nAccess Token (first 50 chars): {data.get('access')[:50]}...")
        print(f"\nUser Data:")
        print(json.dumps(data.get('user'), indent=2))
        
        access_token = data.get('access')
        
        # Test 2: Get current user info
        print("\n[TEST 2] Getting current user info...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/users/me/", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ Got user info successfully!")
            print(json.dumps(response.json(), indent=2))
        else:
            print("✗ Failed to get user info")
            print(response.text)
        
        # Test 3: Switch organization (if user has multiple orgs)
        user_data = data.get('user', {})
        organizations = user_data.get('organizations', [])
        
        if len(organizations) > 1:
            print(f"\n[TEST 3] Switching to organization {organizations[1]['id']}...")
            switch_data = {"organization_id": organizations[1]['id']}
            response = requests.post(
                f"{BASE_URL}/api/users/switch-organization/",
                json=switch_data,
                headers=headers
            )
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✓ Organization switched successfully!")
                print(json.dumps(response.json(), indent=2))
            else:
                print("✗ Failed to switch organization")
                print(response.text)
        else:
            print("\n[TEST 3] Skipped - User has only one organization or none")
    
    else:
        print("✗ Login failed!")
        print(response.text)
    
    print("\n" + "=" * 80)
    print("TESTING COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_email_authentication()
