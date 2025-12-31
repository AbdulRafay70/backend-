"""
Simple script to update organization using manage.py shell
Run: python manage.py shell < update_org_simple.py
"""

from django.contrib.auth import get_user_model
from organization.models import Organization, Agent

User = get_user_model()

print("\n" + "="*80)
print("UPDATING TO ORGANIZATION 11 (ORG-0006)")
print("="*80)

# Get organization 11
try:
    org_11 = Organization.objects.get(id=11)
    org_code = getattr(org_11, 'org_code', 'N/A')
    print(f"\n✓ Found organization:")
    print(f"  - ID: {org_11.id}")
    print(f"  - Name: {org_11.name}")
    print(f"  - Code: {org_code}")
except Organization.DoesNotExist:
    print("\n✗ Organization 11 not found!")
    print("\nAvailable organizations:")
    for org in Organization.objects.all().order_by('id')[:20]:
        code = getattr(org, 'org_code', 'N/A')
        print(f"  - ID: {org.id}, Name: {org.name}, Code: {code}")
    # Try to find by code
    org_11 = Organization.objects.filter(org_code='ORG-0006').first()
    if org_11:
        print(f"\n✓ Found ORG-0006 with ID: {org_11.id}")
    else:
        print("\n✗ Cannot proceed without organization")
        exit(1)

# Get user by email
try:
    user = User.objects.get(email='abdulrafay@gmail.com')
    print(f"\n✓ Found user:")
    print(f"  - ID: {user.id}")
    print(f"  - Username: {user.username}")
    print(f"  - Email: {user.email}")
except User.DoesNotExist:
    print("\n✗ User abdulrafay@gmail.com not found!")
    print("\nTrying to find user by ID 52...")
    try:
        user = User.objects.get(id=52)
        print(f"✓ Found user by ID: {user.username} ({user.email})")
    except:
        print("✗ User ID 52 also not found!")
        exit(1)

# Show current organizations
current_orgs = list(user.organizations.all())
print(f"\nCurrent organizations:")
if current_orgs:
    for org in current_orgs:
        code = getattr(org, 'org_code', 'N/A')
        print(f"  - ID: {org.id}, Name: {org.name}, Code: {code}")
else:
    print("  - None")

# Update organizations
user.organizations.clear()
user.organizations.add(org_11)
print(f"\n✓ Updated organizations to ONLY org {org_11.id}")

# Update Agent if exists
try:
    agent = Agent.objects.get(user=user)
    old_org_id = agent.organization.id if agent.organization else None
    agent.organization = org_11
    agent.save()
    print(f"✓ Updated Agent organization from {old_org_id} to {org_11.id}")
except Agent.DoesNotExist:
    print(f"⚠ Creating new Agent record...")
    agent = Agent.objects.create(user=user, organization=org_11)
    print(f"✓ Created Agent with org {org_11.id}")

# Verify
new_orgs = list(user.organizations.all())
print(f"\n✓ Verification - User now has {len(new_orgs)} organization(s):")
for org in new_orgs:
    code = getattr(org, 'org_code', 'N/A')
    print(f"  - ID: {org.id}, Name: {org.name}, Code: {code}")

print("\n" + "="*80)
print("UPDATE COMPLETE!")
print("="*80)
print(f"\nExpected localStorage after login:")
print(f'  agentOrg: {{"ids":[{org_11.id}],"user_id":{user.id},...}}')
print("\nNext steps:")
print("1. Log out and clear localStorage")
print("2. Log in with", user.email)
print("3. Verify agentOrg shows organization ID 11")
print("="*80 + "\n")
