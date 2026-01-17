"""
Create admin user for Organization 11

Username: admin
Password: admin123

Run with: python create_admin_user.py
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization


def create_admin_user():
    ORG_ID = 11
    USERNAME = 'admin@gmail.com'
    PASSWORD = 'admin123'
    EMAIL = 'admin@gmail.com'
    
    print('\n' + '='*70)
    print('CREATING ADMIN USER FOR ORGANIZATION 11')
    print('='*70)
    
    # Get organization
    try:
        org = Organization.objects.get(id=ORG_ID)
        print(f'\n✅ Found organization:')
        print(f'   ID: {org.id}')
        print(f'   Code: {org.org_code}')
        print(f'   Name: {org.name}')
    except Organization.DoesNotExist:
        print(f'\n❌ ERROR: Organization ID {ORG_ID} not found!')
        return
    
    # Check if user already exists
    if User.objects.filter(username=USERNAME).exists():
        print(f'\n⚠️  User "{USERNAME}" already exists. Updating...')
        user = User.objects.get(username=USERNAME)
        user.set_password(PASSWORD)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.email = EMAIL
        user.save()
        print(f'✅ Updated existing user "{USERNAME}"')
    else:
        # Create new superuser
        user = User.objects.create_superuser(
            username=USERNAME,
            email=EMAIL,
            password=PASSWORD
        )
        print(f'✅ Created new superuser "{USERNAME}"')
    
    # Associate with organization
    if org not in user.organizations.all():
        org.user.add(user)
        print(f'✅ Associated user with Organization {ORG_ID}')
    else:
        print(f'ℹ️  User already associated with Organization {ORG_ID}')
    
    # Also associate with branches and agencies if they exist
    from organization.models import Branch, Agency
    
    branches = Branch.objects.filter(organization_id=ORG_ID)
    for branch in branches:
        if user not in branch.user.all():
            branch.user.add(user)
    if branches.count() > 0:
        print(f'✅ Associated user with {branches.count()} branches')
    
    agencies = Agency.objects.filter(branch__organization_id=ORG_ID)
    for agency in agencies:
        if user not in agency.user.all():
            agency.user.add(user)
    if agencies.count() > 0:
        print(f'✅ Associated user with {agencies.count()} agencies')
    
    print('\n' + '='*70)
    print('✅ ADMIN USER SETUP COMPLETE!')
    print('='*70)
    print(f'\n📝 Login Credentials:')
    print(f'   Username: {USERNAME}')
    print(f'   Password: {PASSWORD}')
    print(f'   Email: {EMAIL}')
    print(f'\n   Superuser: Yes')
    print(f'   Staff: Yes')
    print(f'   Organization: {org.name} (ID: {ORG_ID})')
    print('\n' + '='*70)


if __name__ == '__main__':
    create_admin_user()
