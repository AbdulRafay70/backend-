"""
Update user's organization to only organization 11 (rafay)
Run this script: python update_user_org_to_11.py
"""
import os
import sys
import django

# Add the project directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from organization.models import Organization

User = get_user_model()

def update_user_to_org_11():
    """Update user ID 52 to have access only to organization 11"""
    
    print("\n" + "="*80)
    print("UPDATING USER ORGANIZATION TO ORG 11 (RAFAY)")
    print("="*80)
    
    # Get organization 11
    try:
        org_11 = Organization.objects.get(id=11)
        print(f"\n[OK] Found organization 11: {org_11.name}")
    except Organization.DoesNotExist:
        print("\n[ERROR] Organization 11 not found!")
        print("Available organizations:")
        for org in Organization.objects.all().order_by('id')[:20]:
            print(f"  - ID: {org.id}, Name: {org.name}, Code: {getattr(org, 'org_code', 'N/A')}")
        return
    
    # Get user 52
    try:
        user = User.objects.get(id=52)
        print(f"[OK] Found user: {user.username} (ID: {user.id}, Email: {user.email})")
    except User.DoesNotExist:
        print("\n[ERROR] User with ID 52 not found!")
        print("Recent users:")
        for u in User.objects.all().order_by('-id')[:10]:
            print(f"  - ID: {u.id}, Username: {u.username}, Email: {u.email}")
        return
    
    # Show current organizations
    current_orgs = user.organizations.all()
    print(f"\nCurrent organizations for {user.username}:")
    for org in current_orgs:
        print(f"  - ID: {org.id}, Name: {org.name}")
    
    # Clear all organizations and add only org 11
    user.organizations.clear()
    user.organizations.add(org_11)
    
    print(f"\n[OK] Updated user organizations to ONLY org 11")
    
    # Verify the change
    new_orgs = user.organizations.all()
    print(f"\nNew organizations for {user.username}:")
    for org in new_orgs:
        print(f"  - ID: {org.id}, Name: {org.name}")
    
    print("\n" + "="*80)
    print("UPDATE COMPLETE!")
    print("="*80)
    print("\nNext steps:")
    print("1. Log out from the agent frontend")
    print("2. Clear browser localStorage (or just delete 'agentOrganization' key)")
    print("3. Log back in")
    print("4. The agentOrganization should now show: {\"ids\":[11],\"user_id\":52,...}")
    print("="*80 + "\n")

if __name__ == '__main__':
    update_user_to_org_11()


if __name__ == '__main__':
    update_user_to_org_11()
