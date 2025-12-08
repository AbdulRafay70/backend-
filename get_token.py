"""
Login script to get JWT token for API authentication
"""

import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000/api"

# Login credentials
EMAIL = "abdulrafay@gmail.com"
PASSWORD = "hyd12233"

def get_jwt_token():
    """Login and get JWT token"""
    login_data = {
        "username": EMAIL,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/token/",
            json=login_data
        )
        
        if response.status_code == 200:
            tokens = response.json()
            access_token = tokens.get('access')
            refresh_token = tokens.get('refresh')
            
            print("[SUCCESS] Successfully logged in!")
            print(f"\nAccess Token:\n{access_token}")
            print(f"\nRefresh Token:\n{refresh_token}")
            
            return access_token
        else:
            print(f"[ERROR] Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Error during login: {e}")
        return None

if __name__ == "__main__":
    print("=" * 80)
    print("JWT TOKEN RETRIEVAL")
    print("=" * 80)
    print(f"\nLogging in as: {EMAIL}")
    print("\n" + "=" * 80 + "\n")
    
    token = get_jwt_token()
    
    if token:
        print("\n" + "=" * 80)
        print("[SUCCESS] Token retrieved successfully!")
        print("Copy the access token above and use it in create_emarat_hotel.py")
        print("=" * 80)
