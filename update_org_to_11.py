"""
Update organization to ID 11 (ORG-0006) for user abdulrafay@gmail.com
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from organization.models import Organization, Agent

User = get_user_model()

def update_to_org_11():
    print("\n" + "="*80)
    print("UPDATING TO ORGANIZATION 11 (ORG-0006)")
    print("="*80)
    
    # Check organization 11 exists and has code ORG-0006
    try:
        org_11 = Organization.objects.get(id=11)
        org_code = getattr(org_11, 'org_code', 'N/A')
        print(f"\n✓ Found organization:")
        print(f"  - ID: {org_11.id}")
        print(f"  - Name: {org_11.name}")
        print(f"  - Code: {org_code}")
        
        if org_code != 'ORG-0006':
            print(f"\n⚠ WARNING: Organization code is '{org_code}', expected 'ORG-0006'")
            print("  Do you want to update the organization code? (This will modify the database)")
            
    except Organization.DoesNotExist:
        print("\n✗ Organization with ID 11 not found!")
        print("\nAvailable organizations:")
        for org in Organization.objects.all().order_by('id')[:20]:
            code = getattr(org, 'org_code', 'N/A')
            print(f"  - ID: {org.id}, Name: {org.name}, Code: {code}")
        
        # Check if ORG-0006 exists with different ID
        org_by_code = Organization.objects.filter(org_code='ORG-0006').first()
        if org_by_code:
            print(f"\n⚠ Found ORG-0006 with different ID: {org_by_code.id}")
            print(f"  Name: {org_by_code.name}")
            org_11 = org_by_code
        else:
            print("\n✗ Organization with code ORG-0006 not found either!")
            return
    
    # Find user by email
    try:
        user = User.objects.get(email='abdulrafay@gmail.com')
        print(f"\n✓ Found user:")
        print(f"  - ID: {user.id}")
        print(f"  - Username: {user.username}")
        print(f"  - Email: {user.email}")
    except User.DoesNotExist:
        print("\n✗ User with email 'abdulrafay@gmail.com' not found!")
        print("\nRecent users:")
        for u in User.objects.all().order_by('-id')[:10]:
            print(f"  - ID: {u.id}, Username: {u.username}, Email: {u.email}")
        return
    
    # Show current organizations
    current_orgs = list(user.organizations.all())
    print(f"\nCurrent organizations for {user.username}:")
    if current_orgs:
        for org in current_orgs:
            code = getattr(org, 'org_code', 'N/A')
            print(f"  - ID: {org.id}, Name: {org.name}, Code: {code}")
    else:
        print("  - None")
    
    # Update user organizations to only org 11
    user.organizations.clear()
    user.organizations.add(org_11)
    print(f"\n✓ Updated user organizations to ONLY organization {org_11.id}")
    
    # Check if Agent record exists and update it
    try:
        agent = Agent.objects.get(user=user)
        old_org = agent.organization
        agent.organization = org_11
        agent.save()
        print(f"\n✓ Updated Agent record:")
        print(f"  - Old organization: {old_org.name if old_org else 'None'} (ID: {old_org.id if old_org else 'None'})")
        print(f"  - New organization: {org_11.name} (ID: {org_11.id})")
    except Agent.DoesNotExist:
        print(f"\n⚠ No Agent record found for user {user.username}")
        print("  Creating Agent record...")
        agent = Agent.objects.create(
            user=user,
            organization=org_11
        )
        print(f"✓ Created Agent record with organization {org_11.id}")
    
    # Verify the changes
    new_orgs = list(user.organizations.all())
    print(f"\nVerification - New organizations for {user.username}:")
    for org in new_orgs:
        code = getattr(org, 'org_code', 'N/A')
        print(f"  - ID: {org.id}, Name: {org.name}, Code: {code}")
    
    print("\n" + "="*80)
    print("UPDATE COMPLETE!")
    print("="*80)
    print("\nExpected agentOrg structure after login:")
    print(f'  {{"ids":[{org_11.id}],"user_id":{user.id},"agency_id":...,"branch_id":...}}')
    print("\nNext steps:")
    print("1. Log out from the application")
    print("2. Clear browser localStorage")
    print("3. Log back in with abdulrafay@gmail.com")
    print("4. Verify the agentOrg in localStorage shows organization ID 11")
    print("="*80 + "\n")

if __name__ == '__main__':
    update_to_org_11()
