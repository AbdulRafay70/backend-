"""
Test universal registration endpoint to see exact error.
"""
import requests

url = "http://127.0.0.1:8000/api/universal/"

# Test with minimal data
data = {
    "type": "organization",
    "name": "Test Org",
    "email": "test@example.com",
    "phone": "03001234567"
}

print("Testing universal registration endpoint...")
print(f"Sending data: {data}")

response = requests.post(url, json=data)

print(f"\nStatus Code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code != 201:
    try:
        error_data = response.json()
        print(f"\nError Details: {error_data}")
    except:
        print("Could not parse error as JSON")
