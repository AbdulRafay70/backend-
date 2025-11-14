"""
Test inventory sharing between linked organizations
"""
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from organization.models import OrganizationLink

API_BASE = "http://127.0.0.1:8000"
User = get_user_model()

def get_auth_token():
    """Get authentication token"""
    try:
        # Try to get or create a test user
        user = User.objects.filter(username='admin').first()
        if not user:
            user = User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
            print("Created test admin user (username: admin, password: admin123)")

        # Login to get token
        response = requests.post(f"{API_BASE}/token/", json={
            'username': 'admin',
            'password': 'admin123'
        })

        if response.status_code == 200:
            token = response.json().get('access')
            print(f"✓ Obtained auth token")
            return f"Bearer {token}"
        else:
            print(f"✗ Token auth failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Auth setup error: {str(e)}")
        return None

def test_inventory_sharing():
    """Test that linked organizations can access each other's inventory"""
    print("\n" + "="*80)
    print("TESTING INVENTORY SHARING BETWEEN LINKED ORGANIZATIONS")
    print("="*80)

    # Check current links
    print("\n1. Checking organization links:")
    linked_orgs = OrganizationLink.get_linked_organizations(11)
    print(f"   Org 11 (rafay) is linked to: {linked_orgs}")

    linked_orgs_13 = OrganizationLink.get_linked_organizations(13)
    print(f"   Org 13 (abc@gmail.com) is linked to: {linked_orgs_13}")

    # Get auth token
    token = get_auth_token()
    if not token:
        print("✗ Cannot proceed without auth token")
        return

    headers = {'Authorization': token}

    # Test hotels API for org 11
    print("\n2. Testing hotels API for organization 11:")
    try:
        response = requests.get(f"{API_BASE}/api/hotels/?organization=11", headers=headers)
        if response.status_code == 200:
            hotels = response.json()
            print(f"   ✓ API call successful, returned {len(hotels)} hotels")

            # Show hotel details
            for hotel in hotels:
                org_name = "Unknown"
                if hotel.get('organization'):
                    try:
                        from organization.models import Organization
                        org = Organization.objects.get(id=hotel['organization'])
                        org_name = org.name
                    except:
                        org_name = f"ID {hotel['organization']}"

                print(f"     - {hotel['name']} (Org: {org_name}, ID: {hotel['organization']})")

            # Check if we have hotels from linked orgs
            org_11_hotels = [h for h in hotels if h.get('organization') == 11]
            org_13_hotels = [h for h in hotels if h.get('organization') == 13]

            print(f"\n   Org 11 hotels: {len(org_11_hotels)}")
            print(f"   Org 13 hotels: {len(org_13_hotels)}")

            if len(org_13_hotels) > 0:
                print("   ✓ SUCCESS: Inventory sharing is working! Org 11 can see Org 13's hotels")
            else:
                print("   ⚠ WARNING: No hotels from linked org 13 found")

        else:
            print(f"   ✗ API call failed: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"   ✗ Error testing hotels API: {str(e)}")

    # Test tickets API for org 11
    print("\n3. Testing tickets API for organization 11:")
    try:
        response = requests.get(f"{API_BASE}/api/tickets/?organization=11", headers=headers)
        if response.status_code == 200:
            tickets = response.json()
            print(f"   ✓ API call successful, returned {len(tickets)} tickets")

            # Show ticket details
            for ticket in tickets[:5]:  # Show first 5
                org_name = "Unknown"
                if ticket.get('organization'):
                    try:
                        from organization.models import Organization
                        org = Organization.objects.get(id=ticket['organization'])
                        org_name = org.name
                    except:
                        org_name = f"ID {ticket['organization']}"

                print(f"     - {ticket.get('title', 'No title')} (Org: {org_name}, ID: {ticket['organization']})")

            # Check if we have tickets from linked orgs
            org_11_tickets = [t for t in tickets if t.get('organization') == 11]
            org_13_tickets = [t for t in tickets if t.get('organization') == 13]

            print(f"\n   Org 11 tickets: {len(org_11_tickets)}")
            print(f"   Org 13 tickets: {len(org_13_tickets)}")

            if len(org_13_tickets) > 0:
                print("   ✓ SUCCESS: Inventory sharing is working! Org 11 can see Org 13's tickets")
            else:
                print("   ⚠ WARNING: No tickets from linked org 13 found")

        else:
            print(f"   ✗ API call failed: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"   ✗ Error testing tickets API: {str(e)}")

    # Test packages API for org 11
    print("\n4. Testing packages API for organization 11:")
    try:
        response = requests.get(f"{API_BASE}/api/packages/?organization=11", headers=headers)
        if response.status_code == 200:
            packages = response.json()
            print(f"   ✓ API call successful, returned {len(packages)} packages")

            # Show package details
            for package in packages[:5]:  # Show first 5
                org_name = "Unknown"
                if package.get('organization'):
                    try:
                        from organization.models import Organization
                        org = Organization.objects.get(id=package['organization'])
                        org_name = org.name
                    except:
                        org_name = f"ID {package['organization']}"

                print(f"     - {package.get('title', 'No title')} (Org: {org_name}, ID: {package['organization']})")

            # Check if we have packages from linked orgs
            org_11_packages = [p for p in packages if p.get('organization') == 11]
            org_13_packages = [p for p in packages if p.get('organization') == 13]

            print(f"\n   Org 11 packages: {len(org_11_packages)}")
            print(f"   Org 13 packages: {len(org_13_packages)}")

            if len(org_13_packages) > 0:
                print("   ✓ SUCCESS: Inventory sharing is working! Org 11 can see Org 13's packages")
            else:
                print("   ⚠ WARNING: No packages from linked org 13 found")

        else:
            print(f"   ✗ API call failed: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"   ✗ Error testing packages API: {str(e)}")

    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80)

if __name__ == '__main__':
    test_inventory_sharing()