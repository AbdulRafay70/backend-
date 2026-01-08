"""
Make abdulrafay@gmail.com a superuser with full Django admin access.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth.models import User

def make_superuser():
    print("=" * 80)
    print("GRANTING DJANGO ADMIN SUPERUSER ACCESS")
    print("=" * 80)
    
    email = "abdulrafay@gmail.com"
    
    try:
        user = User.objects.get(email=email)
        print(f"\n✓ Found user: {user.email}")
        print(f"  Username: {user.username}")
        print(f"  Current status:")
        print(f"    - is_staff: {user.is_staff}")
        print(f"    - is_superuser: {user.is_superuser}")
        print(f"    - is_active: {user.is_active}")
        
        # Make user superuser and staff
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        
        # Set password to admin123
        user.set_password("admin123")
        user.save()
        
        print(f"\n✓ User updated successfully!")
        print(f"  New status:")
        print(f"    - is_staff: {user.is_staff} (can access admin)")
        print(f"    - is_superuser: {user.is_superuser} (has all permissions)")
        print(f"    - is_active: {user.is_active}")
        print(f"    - Password: admin123")
        
        print("\n" + "=" * 80)
        print("SUPERUSER ACCESS GRANTED!")
        print("=" * 80)
        print(f"\nYou can now login to Django admin at /admin/ with:")
        print(f"  Email/Username: {user.email} or {user.username}")
        print(f"  Password: admin123")
        print(f"\nYou will have FULL ACCESS to view and edit everything!")
        print("=" * 80)
        
    except User.DoesNotExist:
        print(f"\n✗ User with email '{email}' not found!")
        print("\nCreating new superuser...")
        
        user = User.objects.create(
            username=email,
            email=email,
            is_staff=True,
            is_superuser=True,
            is_active=True,
            first_name="Abdul Rafay"
        )
        user.set_password("admin123")
        user.save()
        
        print(f"✓ Created superuser: {user.email}")
        print(f"  Password: admin123")
        print("\n" + "=" * 80)

if __name__ == '__main__':
    make_superuser()
