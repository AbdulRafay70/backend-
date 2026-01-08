"""
Add user profiles to fix login issue

The login is failing because it checks for userData.profile.type
but the users don't have profiles yet.

Run with: python add_user_profiles.py
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import User


def add_user_profiles():
    print('\n' + '='*70)
    print('ADDING USER PROFILES')
    print('='*70)
    
    # Check if UserProfile model exists
    try:
        from users.models import UserProfile
        
        for user in User.objects.all():
            # Check if profile exists
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'type': 'admin' if user.is_superuser else 'staff',
                    'phone_number': '',
                }
            )
            
            if created:
                print(f'✅ Created profile for {user.username} (type: {profile.type})')
            else:
                print(f'ℹ️  Profile already exists for {user.username} (type: {profile.type})')
        
        print('\n✅ All users have profiles!')
        
    except ImportError:
        print('⚠️  UserProfile model not found')
        print('   The login might work without profiles')
        print('   Or the profile check needs to be removed from Login.jsx')
    
    print('\n' + '='*70)


if __name__ == '__main__':
    add_user_profiles()
