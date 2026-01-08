"""
Test the specific API endpoints to debug routing.
"""
import requests

BASE_URL = "http://127.0.0.1:8000"

# First login
print("Logging in...")
response = requests.post(f"{BASE_URL}/api/token/", json={
    "email": "admin@example.com",
    "password": "admin123"
})

if response.status_code == 200:
    data = response.json()
    token = data['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test different URL patterns
    endpoints = [
        "/api/users/me/",
        "/api/user/me/",
        "/users/me/",
        "/api/users/switch-organization/",
        "/api/user/switch-organization/",
        "/users/switch-organization/",
    ]
    
    print("\nTesting endpoints:")
    print("=" * 80)
    for endpoint in endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            resp = requests.get(url, headers=headers, timeout=2)
            print(f"{endpoint:40} -> {resp.status_code}")
        except Exception as e:
            print(f"{endpoint:40} -> ERROR: {e}")
    
else:
    print(f"Login failed: {response.status_code}")
    print(response.text)
