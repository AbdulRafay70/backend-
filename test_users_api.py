import requests
import json

# Test the users API endpoint
url = "http://127.0.0.1:8000/api/users/"

# Get the access token from your browser's localStorage or use a test token
# For now, let's try without authentication first
try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse Headers: {dict(response.headers)}")
    print(f"\nResponse Body:")
    
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        
        if isinstance(data, list):
            print(f"\n\nTotal users returned: {len(data)}")
            if len(data) > 0:
                print(f"\nFirst user structure:")
                print(json.dumps(data[0], indent=2))
        elif isinstance(data, dict) and 'results' in data:
            print(f"\n\nTotal users returned: {len(data['results'])}")
            if len(data['results']) > 0:
                print(f"\nFirst user structure:")
                print(json.dumps(data['results'][0], indent=2))
    else:
        print(response.text)
        
except Exception as e:
    print(f"Error: {e}")
