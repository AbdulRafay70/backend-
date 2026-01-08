"""
Update existing user to set username = email for email-based login.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth.models import User

def update_user_for_email_login():
    print("=" * 80)
    print("UPDATING USER FOR EMAIL-BASED LOGIN")
    print("=" * 80)
    
    try:
        user = User.objects.get(email="admin@example.com")
        print(f"\n✓ Found user: {user.email}")
        print(f"  Current username: {user.username}")
        
        # Update username to equal email
        old_username = user.username
        user.username = user.email
        user.save()
        
        print(f"\n✓ Updated username:")
        print(f"  Old: {old_username}")
        print(f"  New: {user.username}")
        
        print("\n" + "=" * 80)
        print("USER UPDATED SUCCESSFULLY!")
        print("=" * 80)
        print(f"\nYou can now login with:")
        print(f"  Email: {user.email}")
        print(f"  Password: admin123")
        print("=" * 80)
        
    except User.DoesNotExist:
        print("\n✗ User not found!")
    except Exception as e:
        print(f"\n✗ Error: {e}")

if __name__ == '__main__':
    update_user_for_email_login()
