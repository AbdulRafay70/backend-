import requests
import json

# Test user creation API
url = "http://127.0.0.1:8000/api/users/?organization=11"

# Get access token (you'll need to replace this with a valid token)
# For now, let's just test the payload structure

payload = {
    "first_name": "Test User",
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "testpass123",
    "is_active": True,
    "groups": [],
    "organizations": [11],
    "branches": [],  # Empty array
    "agencies": [],
    "profile": {
        "type": "employee"
    }
}

print("Testing payload:")
print(json.dumps(payload, indent=2))

# You would need to add authorization header here
# headers = {
#     "Authorization": "Bearer YOUR_TOKEN_HERE",
#     "Content-Type": "application/json"
# }
# response = requests.post(url, json=payload, headers=headers)
# print(f"Status: {response.status_code}")
# print(f"Response: {response.json()}")
