"""
Verify all branches in the database
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Organization, Branch

print("=" * 60)
print("BRANCHES IN DATABASE")
print("=" * 60)
print()

# Check all branches
branches = Branch.objects.all()
print(f"📊 Total Branches: {branches.count()}")
print()

if branches.count() > 0:
    for branch in branches:
        org = branch.organization
        print(f"Branch ID: {branch.id}")
        print(f"  • Code: {branch.branch_code}")
        print(f"  • Name: {branch.name}")
        print(f"  • Contact: {branch.contact_number}")
        print(f"  • Email: {branch.email}")
        print(f"  • Address: {branch.address}")
        print(f"  • Organization: {org.name} (ID: {org.id}, Code: {org.org_code})")
        print()
else:
    print("❌ No branches found in database!")
    print()

# Check all organizations
orgs = Organization.objects.all()
print(f"📊 Total Organizations: {orgs.count()}")
for org in orgs:
    print(f"  • {org.name} (ID: {org.id}, Code: {org.org_code})")

print()
print("=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
