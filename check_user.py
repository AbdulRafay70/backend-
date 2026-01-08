"""
Check and fix the test admin user.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth.models import User

def check_and_fix_user():
    print("=" * 80)
    print("CHECKING TEST ADMIN USER")
    print("=" * 80)
    
    try:
        user = User.objects.get(email="admin@example.com")
        print(f"\n✓ Found user: {user.email}")
        print(f"  - Username: {user.username}")
        print(f"  - Is Active: {user.is_active}")
        print(f"  - Is Staff: {user.is_staff}")
        print(f"  - Is Superuser: {user.is_superuser}")
        
        # Check if user is active
        if not user.is_active:
            print("\n⚠ User is INACTIVE! Activating...")
            user.is_active = True
            user.save()
            print("✓ User activated!")
        
        # Check password
        print("\n[Password Check]")
        is_valid = user.check_password("admin123")
        print(f"  - Password 'admin123' is valid: {is_valid}")
        
        if not is_valid:
            print("\n⚠ Password not set correctly. Resetting...")
            user.set_password("admin123")
            user.save()
            print("✓ Password reset to 'admin123'")
        
        # Check organizations
        print("\n[Organizations]")
        orgs = user.organizations.all()
        print(f"  - Linked to {orgs.count()} organization(s)")
        for org in orgs:
            print(f"    • {org.name} ({org.org_code})")
        
        # Check profile
        print("\n[Profile]")
        try:
            print(f"  - Profile type: {user.profile.type}")
        except:
            print("  - No profile found")
        
        print("\n" + "=" * 80)
        print("USER CHECK COMPLETE")
        print("=" * 80)
        
    except User.DoesNotExist:
        print("\n✗ User not found!")

if __name__ == '__main__':
    check_and_fix_user()
