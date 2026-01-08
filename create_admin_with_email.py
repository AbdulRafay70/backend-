"""
Create a new admin user with email-based login (username = email).
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization
from users.models import UserProfile

def create_admin_user_with_email_login():
    """
    Creates an admin user where username = email for email-based authentication.
    """
    print("=" * 80)
    print("CREATING ADMIN USER WITH EMAIL-BASED LOGIN")
    print("=" * 80)
    
    email = input("\nEnter email address: ").strip()
    if not email:
        print("✗ Email is required!")
        return
    
    password = input("Enter password: ").strip()
    if not password:
        print("✗ Password is required!")
        return
    
    first_name = input("Enter first name (optional): ").strip() or "Admin"
    last_name = input("Enter last name (optional): ").strip() or "User"
    
    # Create organization
    print("\n[1] Creating/finding organization...")
    org_name = input("Enter organization name (or press Enter to skip): ").strip()
    org = None
    if org_name:
        org, created = Organization.objects.get_or_create(
            name=org_name,
            defaults={
                "email": email,
                "phone_number": "",
                "address": ""
            }
        )
        if created:
            print(f"✓ Created organization: {org.name} ({org.org_code})")
        else:
            print(f"✓ Organization already exists: {org.name} ({org.org_code})")
    
    # Create admin user with email as username
    print("\n[2] Creating admin user...")
    try:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,  # Use email as username for email-based login
                "first_name": first_name,
                "last_name": last_name,
                "is_staff": True,  # Can access admin panel
                "is_superuser": False,
                "is_active": True,
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            print(f"✓ Created user: {user.email}")
        else:
            print(f"✓ User already exists: {user.email}")
            update = input("  Update password? (y/n): ").strip().lower()
            if update == 'y':
                user.set_password(password)
                user.save()
                print("  ✓ Password updated")
    except Exception as e:
        print(f"✗ Error creating user: {e}")
        return
    
    # Create or update user profile
    print("\n[3] Creating/updating user profile...")
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.type = "admin"
    profile.save()
    print(f"✓ Profile type set to: {profile.type}")
   
    # Link user to organization
    if org:
        print(f"\n[4] Linking user to organization...")
        if not user.organizations.filter(id=org.id).exists():
            user.organizations.add(org)
            print(f"✓ Linked user to organization: {org.name}")
        else:
            print(f"✓ User already linked to organization: {org.name}")
    
    print("\n" + "=" * 80)
    print("ADMIN USER CREATED SUCCESSFULLY!")
    print("=" * 80)
    print(f"\nLogin credentials:")
    print(f"  Email: {user.email}")
    print(f"  Password: {password}")
    print(f"  Username: {user.username} (same as email)")
    if org:
        print(f"\nOrganization: {org.name} ({org.org_code})")
    print("\n💡 You can now login with email address!")
    print("=" * 80)

if __name__ == '__main__':
    create_admin_user_with_email_login()
