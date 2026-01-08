"""
Test script to verify organization and create a test branch
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Organization, Branch

print("=" * 60)
print("TESTING ORGANIZATION AND BRANCH CREATION")
print("=" * 60)
print()

# Check organizations
orgs = Organization.objects.all()
print(f"📊 Total Organizations: {orgs.count()}")
for org in orgs:
    print(f"   • ID: {org.id}, Name: {org.name}, Code: {org.org_code}")
print()

if orgs.count() > 0:
    org = orgs.first()
    print(f"✅ Using organization: {org.name} (ID: {org.id})")
    print()
    
    # Try to create a test branch
    print("🔨 Creating test branch...")
    try:
        branch = Branch.objects.create(
            organization=org,
            name="Main Branch",
            contact_number="+92-300-1234567",
            email="mainbranch@saer.pk",
            address="Karachi, Pakistan"
        )
        print(f"   ✅ Branch created successfully!")
        print(f"   • ID: {branch.id}")
        print(f"   • Name: {branch.name}")
        print(f"   • Code: {branch.branch_code}")
        print(f"   • Organization: {branch.organization.name}")
    except Exception as e:
        print(f"   ❌ Error creating branch: {e}")
else:
    print("❌ No organizations found! Please run reset_and_setup_db.py first.")

print()
print("=" * 60)
print("TEST COMPLETED")
print("=" * 60)
