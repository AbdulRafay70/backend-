"""
Verify user credentials and test login

Run with: python verify_login.py
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User


def verify_login():
    print('\n' + '='*70)
    print('VERIFYING LOGIN CREDENTIALS')
    print('='*70)
    
    # Test credentials
    test_users = [
        ('admin@gmail.com', 'admin@123'),
        ('agent@gmail.com', 'agent@123'),
    ]
    
    for username, password in test_users:
        print(f'\n📝 Testing: {username}')
        
        # Check if user exists
        try:
            user = User.objects.get(username=username)
            print(f'   ✅ User exists in database')
            print(f'      - ID: {user.id}')
            print(f'      - Email: {user.email}')
            print(f'      - Active: {user.is_active}')
            print(f'      - Staff: {user.is_staff}')
            print(f'      - Superuser: {user.is_superuser}')
            
            # Test authentication
            auth_user = authenticate(username=username, password=password)
            if auth_user:
                print(f'   ✅ Authentication SUCCESSFUL')
            else:
                print(f'   ❌ Authentication FAILED')
                print(f'      - User exists but password may be wrong')
                
                # Try to reset password
                print(f'   🔧 Resetting password...')
                user.set_password(password)
                user.save()
                print(f'   ✅ Password reset')
                
                # Test again
                auth_user = authenticate(username=username, password=password)
                if auth_user:
                    print(f'   ✅ Authentication NOW WORKS after reset')
                else:
                    print(f'   ❌ Still failing - check custom authentication backends')
                
        except User.DoesNotExist:
            print(f'   ❌ User NOT found in database')
    
    print('\n' + '='*70)
    print('VERIFICATION COMPLETE')
    print('='*70)
    
    # Show all users in database
    all_users = User.objects.all()
    print(f'\n📊 Total users in database: {all_users.count()}')
    for user in all_users:
        print(f'   - {user.username} (ID: {user.id}, Active: {user.is_active}, Staff: {user.is_staff})')
    
    print('\n' + '='*70)


if __name__ == '__main__':
    verify_login()
