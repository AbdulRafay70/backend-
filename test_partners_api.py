import requests
import sys

# Test the partners API with organization parameter
base_url = "http://127.0.0.1:8000/api/users/"

# You need to provide a valid access token
# Get it from the browser's localStorage or by logging in
print("To test the API, please provide an access token.")
print("You can get it from the browser's localStorage (key: 'accessToken')")
print("\nOr run this script with the token as an argument:")
print("python test_partners_api.py YOUR_ACCESS_TOKEN")

if len(sys.argv) > 1:
    access_token = sys.argv[1]
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("\nTesting API endpoint with organization parameter...")
    
    # Test 1: Without any parameters
    print("\n1. Testing without parameters:")
    response = requests.get(base_url, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total users returned: {len(data) if isinstance(data, list) else 'N/A'}")
        print(f"Response type: {type(data)}")
    else:
        print(f"Error: {response.text}")
    
    # Test 2: With organization parameter (the one frontend uses)
    print("\n2. Testing with organization=11 parameter:")
    response = requests.get(f"{base_url}?organization=11", headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total users returned: {len(data) if isinstance(data, list) else 'N/A'}")
        if isinstance(data, list):
            print(f"Users in organization 11:")
            for user in data:
                print(f"  - {user.get('username', 'N/A')} (ID: {user.get('id', 'N/A')})")
    else:
        print(f"Error: {response.text}")
    
    # Test 3: With organization_id parameter (old parameter)
    print("\n3. Testing with organization_id=11 parameter:")
    response = requests.get(f"{base_url}?organization_id=11", headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total users returned: {len(data) if isinstance(data, list) else 'N/A'}")
        if isinstance(data, list):
            print(f"Users in organization 11:")
            for user in data:
                print(f"  - {user.get('username', 'N/A')} (ID: {user.get('id', 'N/A')})")
    else:
        print(f"Error: {response.text}")
else:
    print("\nNo token provided. Exiting...")
