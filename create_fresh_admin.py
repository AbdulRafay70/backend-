"""
Create fresh admin user for Organization 11
This will delete the old admin and create a new one

Run with: python create_fresh_admin.py
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


def create_fresh_admin():
    ORG_ID = 11
    USERNAME = 'admin@gmail.com'
    PASSWORD = 'admin123'
    EMAIL = 'admin@gmail.com'
    
    print('\n' + '='*70)
    print('CREATING FRESH ADMIN USER')
    print('='*70)
    
    # Get organization
    try:
        org = Organization.objects.get(id=ORG_ID)
        print(f'\n✅ Found organization: {org.name} (ID: {ORG_ID})')
    except Organization.DoesNotExist:
        print(f'\n❌ ERROR: Organization ID {ORG_ID} not found!')
        return
    
    # Delete old admin users if they exist
    old_admins = User.objects.filter(username__in=['admin', 'admin@gmail.com'])
    if old_admins.exists():
        count = old_admins.count()
        old_admins.delete()
        print(f'🗑️  Deleted {count} old admin user(s)')
    
    # Create fresh superuser
    user = User.objects.create_superuser(
        username=USERNAME,
        email=EMAIL,
        password=PASSWORD
    )
    print(f'✅ Created new superuser "{USERNAME}"')
    
    # Associate with organization
    org.user.add(user)
    print(f'✅ Associated with Organization {ORG_ID}')
    
    # Associate with branches and agencies
    from organization.models import Branch, Agency
    
    branches = Branch.objects.filter(organization_id=ORG_ID)
    for branch in branches:
        branch.user.add(user)
    if branches.count() > 0:
        print(f'✅ Associated with {branches.count()} branches')
    
    agencies = Agency.objects.filter(branch__organization_id=ORG_ID)
    for agency in agencies:
        agency.user.add(user)
    if agencies.count() > 0:
        print(f'✅ Associated with {agencies.count()} agencies')
    
    print('\n' + '='*70)
    print('✅ FRESH ADMIN USER CREATED!')
    print('='*70)
    print(f'\n🔑 LOGIN CREDENTIALS:')
    print(f'   Username: {USERNAME}')
    print(f'   Password: {PASSWORD}')
    print(f'\n   Organization: {org.name} (ID: {ORG_ID})')
    print('='*70)


if __name__ == '__main__':
    create_fresh_admin()
