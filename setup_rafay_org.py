import os
import sys
import django

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Organization, Branch, Agency
from django.contrib.auth.models import User, Group
from users.models import UserProfile, GroupExtension
from booking.models import Booking
from packages.models import Package

def setup_rafay_organization():
    """Remove all organizations and create a fresh Rafay organization"""
    
    try:
        print("="*60, flush=True)
        print("STEP 1: Removing all existing organizations", flush=True)
        print("="*60, flush=True)
        
        # Delete all organizations (this will cascade to related data)
        org_count = Organization.objects.count()
        print(f"Deleting {org_count} organizations...", flush=True)
        Organization.objects.all().delete()
        print(f"✓ Deleted {org_count} organizations", flush=True)
        
        # Delete all users except superusers
        regular_users = User.objects.filter(is_superuser=False)
        user_count = regular_users.count()
        print(f"Deleting {user_count} regular users...", flush=True)
        regular_users.delete()
        print(f"✓ Deleted {user_count} users", flush=True)
        
        # Delete all groups
        group_count = Group.objects.count()
        print(f"Deleting {group_count} groups...", flush=True)
        Group.objects.all().delete()
        print(f"✓ Deleted {group_count} groups", flush=True)
        
        print("\n" + "="*60, flush=True)
        print("STEP 2: Creating Rafay Organization", flush=True)
        print("="*60, flush=True)
        
        # Create Rafay organization
        rafay_org = Organization.objects.create(
            name="Rafay",
            email="rafay@gmail.com",
            phone="+92-300-1234567",
            address="Rafay Office, Pakistan",
            city="Karachi",
            state="Sindh",
            country="Pakistan",
            zip_code="75500",
            website="https://rafay.com",
            logo="",
            description="Rafay Organization",
            is_active=True
        )
        print(f"✓ Created organization: {rafay_org.name} ({rafay_org.email})", flush=True)
        
        # Create admin user for Rafay organization
        admin_user = User.objects.create_user(
            username="rafay_admin",
            email="rafay@gmail.com",
            password="admin@123",
            first_name="Rafay",
            last_name="Admin",
            is_staff=True,
            is_active=True
        )
        print(f"✓ Created admin user: {admin_user.username} ({admin_user.email})", flush=True)
        
        # Create user profile
        user_profile = UserProfile.objects.create(
            user=admin_user,
            type="admin"
        )
        print(f"✓ Created user profile for {admin_user.username}", flush=True)
        
        # Create admin group for this organization
        admin_group = Group.objects.create(
            name=f"Rafay_Admin"
        )
        print(f"✓ Created group: {admin_group.name}", flush=True)
        
        # Create group extension linking to organization
        group_ext = GroupExtension.objects.create(
            group=admin_group,
            organization=rafay_org,
            type="admin"
        )
        print(f"✓ Linked group to organization", flush=True)
        
        # Add user to admin group
        admin_user.groups.add(admin_group)
        print(f"✓ Added {admin_user.username} to {admin_group.name}", flush=True)
        
        print("\n" + "="*60, flush=True)
        print("✓ SETUP COMPLETE!", flush=True)
        print("="*60, flush=True)
        print("\nLogin Credentials:", flush=True)
        print(f"  Email: rafay@gmail.com", flush=True)
        print(f"  Password: admin@123", flush=True)
        print(f"\nOrganization: {rafay_org.name}", flush=True)
        print("="*60, flush=True)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    setup_rafay_organization()

