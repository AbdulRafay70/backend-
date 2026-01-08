"""
Create a test admin user with an organization for testing email authentication.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization
from users.models import UserProfile

def create_test_admin_user():
    print("=" * 80)
    print("CREATING TEST ADMIN USER")
    print("=" * 80)
    
    # Create organization
    print("\n[1] Creating organization...")
    org, created = Organization.objects.get_or_create(
        email="testorg@example.com",
        defaults={
            "name": "Test Organization",
            "phone_number": "1234567890",
            "address": "123 Test St"
        }
    )
    if created:
        print(f"✓ Created organization: {org.name} ({org.org_code})")
    else:
        print(f"✓ Organization already exists: {org.name} ({org.org_code})")
    
    # Create admin user
    print("\n[2] Creating admin user...")
    user, created = User.objects.get_or_create(
        email="admin@example.com",
        defaults={
            "username": "admin",
            "first_name": "Admin",
            "last_name": "User",
            "is_staff": True,  # Can access admin panel
            "is_superuser":  False,
        }
    )
    
    if created:
        user.set_password("admin123")
        user.save()
        print(f"✓ Created user: {user.email}")
    else:
        print(f"✓ User already exists: {user.email}")
    
    # Create or update user profile
    print("\n[3] Creating/updating user profile...")
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.type = "admin"
    profile.save()
    print(f"✓ Profile type set to: {profile.type}")
    
    # Link user to organization
    print("\n[4] Linking user to organization...")
    if not user.organizations.filter(id=org.id).exists():
        user.organizations.add(org)
        print(f"✓ Linked user to organization: {org.name}")
    else:
        print(f"✓ User already linked to organization: {org.name}")
    
    print("\n" + "=" * 80)
    print("TEST USER CREATED SUCCESSFULLY!")
    print("=" *80)
    print(f"\nLogin credentials:")
    print(f"  Email: {user.email}")
    print(f"  Password: admin123")
    print(f"\nOrganization: {org.name} ({org.org_code})")
    print("=" * 80)

if __name__ == '__main__':
    create_test_admin_user()
