#!/usr/bin/env python
"""
Script to test the OrganizationLinks API endpoint.
Run with: python test_org_links_api.py
"""

import requests
import json

def test_org_links_api():
    """Test the organization links API endpoint"""

    base_url = "http://127.0.0.1:8000"
    endpoint = "/api/organization-links/"

    try:
        # Make GET request to organization links endpoint
        response = requests.get(f"{base_url}{endpoint}")

        print(f"API Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"API Response: {json.dumps(data, indent=2)}")

            if isinstance(data, list):
                print(f"\nFound {len(data)} organization links in API response")
                for i, link in enumerate(data, 1):
                    print(f"Link {i}: Main={link.get('Main_organization_id')} ↔ Link={link.get('Link_organization_id')} (Status: {link.get('request_status')})")
            else:
                print("API response is not a list")

        else:
            print(f"API Error: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure Django server is running on port 8000")
    except Exception as e:
        print(f"❌ Error testing API: {e}")

if __name__ == "__main__":
    test_org_links_api()