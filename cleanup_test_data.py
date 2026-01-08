"""
Clean up test data - remove duplicate organization and agencies.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization, Agency, Branch

def cleanup_test_data():
    print("=" * 80)
    print("CLEANING UP TEST DATA")
    print("=" * 80)
    
    try:
        user = User.objects.get(email="admin@example.com")
        print(f"\n✓ Found user: {user.email}")
        
        # Get all organizations
        all_orgs = Organization.objects.all()
        print(f"\nAll organizations ({all_orgs.count()}):")
        for org in all_orgs:
            print(f"  - {org.name} ({org.org_code})")
        
        # Delete organization with email as name
        org_to_delete = Organization.objects.filter(name="admin@example.com").first()
        if org_to_delete:
            print(f"\n✗ Deleting organization: {org_to_delete.name}")
            org_to_delete.delete()
            print("  ✓ Deleted")
        
        # Delete all agencies
        agencies = Agency.objects.all()
        if agencies.exists():
            print(f"\n✗ Deleting {agencies.count()} agencies...")
            agencies.delete()
            print("  ✓ Deleted all agencies")
        
        # Delete all branches
        branches = Branch.objects.all()
        if branches.exists():
            print(f"\n✗ Deleting {branches.count()} branches...")
            branches.delete()
            print("  ✓ Deleted all branches")
        
        # Keep only Test Organization
        test_org = Organization.objects.filter(name="Test Organization").first()
        if test_org:
            print(f"\n✓ Keeping organization: {test_org.name} ({test_org.org_code})")
            # Link user only to this organization
            user.organizations.clear()
            user.organizations.add(test_org)
            print(f"  ✓ User linked only to: {test_org.name}")
        
        # Clear any agency/branch links
        user.agencies.clear()
        user.branches.clear()
        print("  ✓ Cleared all agency and branch links")
        
        print("\n" + "=" * 80)
        print("CLEANUP COMPLETE!")
        print("=" * 80)
        print(f"\nUser: {user.email}")
        print(f"Organizations: {user.organizations.count()}")
        for org in user.organizations.all():
            print(f"  - {org.name} ({org.org_code})")
        print(f"Agencies: {user.agencies.count()}")
        print(f"Branches: {user.branches.count()}")
        print("=" * 80)
        
    except User.DoesNotExist:
        print("\n✗ User not found!")
    except Exception as e:
        print(f"\n✗ Error: {e}")

if __name__ == '__main__':
    cleanup_test_data()
