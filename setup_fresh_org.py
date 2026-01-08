"""
Setup fresh organization and admin user

This will create:
- Organization with email: abdulrafay@gmail.com
- Admin user: admin@gmail.com / admin@123
- One branch and one agency

Run with: python setup_fresh_org.py
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from datetime import date


def setup_fresh_organization():
    ORG_EMAIL = 'abdulrafay@gmail.com'
    ADMIN_USERNAME = 'admin@gmail.com'
    ADMIN_PASSWORD = 'admin@123'
    AGENT_USERNAME = 'agent@gmail.com'
    AGENT_PASSWORD = 'agent@123'
    
    print('\n' + '='*70)
    print('SETTING UP FRESH ORGANIZATION')
    print('='*70)
    
    # 1. Create organization (using correct fields)
    org = Organization.objects.create(
        name='SAER Pakistan',
        email=ORG_EMAIL,
        phone_number='03001234567',
        address='Lahore, Pakistan'
    )
    print(f'\n✅ Created organization:')
    print(f'   Name: {org.name}')
    print(f'   Email: {org.email}')
    print(f'   Code: {org.org_code}')
    print(f'   ID: {org.id}')
    
    # 2. Create branch
    branch = Branch.objects.create(
        organization=org,
        name='Main Branch',
        branch_code='BR-001',
        address='Main Office, Lahore'
    )
    print(f'\n✅ Created branch:')
    print(f'   Name: {branch.name}')
    print(f'   Code: {branch.branch_code}')
    print(f'   ID: {branch.id}')
    
    # 3. Create agency
    agency = Agency.objects.create(
        branch=branch,
        name='Main Agency',
        agency_code='AG-001',
        address='Main Office, Lahore'
    )
    print(f'\n✅ Created agency:')
    print(f'   Name: {agency.name}')
    print(f'   Code: {agency.agency_code}')
    print(f'   ID: {agency.id}')
    
    # 4. Create admin user (superuser)
    admin_user = User.objects.create_superuser(
        username=ADMIN_USERNAME,
        email=ADMIN_USERNAME,
        password=ADMIN_PASSWORD
    )
    print(f'\n✅ Created admin user:')
    print(f'   Username: {ADMIN_USERNAME}')
    print(f'   Password: {ADMIN_PASSWORD}')
    print(f'   Superuser: Yes')
    
    # 5. Create agent user (regular user)
    agent_user = User.objects.create_user(
        username=AGENT_USERNAME,
        email=AGENT_USERNAME,
        password=AGENT_PASSWORD,
        is_staff=True,
        is_active=True
    )
    print(f'\n✅ Created agent user:')
    print(f'   Username: {AGENT_USERNAME}')
    print(f'   Password: {AGENT_PASSWORD}')
    print(f'   Staff: Yes')
    
    # 6. Associate admin user with organization, branch, and agency
    org.user.add(admin_user)
    branch.user.add(admin_user)
    agency.user.add(admin_user)
    print(f'\n✅ Associated admin user with org/branch/agency')
    
    # 7. Associate agent user with agency (and its branch/org)
    org.user.add(agent_user)
    branch.user.add(agent_user)
    agency.user.add(agent_user)
    print(f'\n✅ Associated agent user with org/branch/agency')
    
    print('\n' + '='*70)
    print('✅ SETUP COMPLETE!')
    print('='*70)
    
    print(f'\n🏢 Organization Details:')
    print(f'   ID: {org.id}')
    print(f'   Name: {org.name}')
    print(f'   Email: {org.email}')
    print(f'   Code: {org.org_code}')
    
    print(f'\n🔑 Admin Login Credentials:')
    print(f'   Username: {ADMIN_USERNAME}')
    print(f'   Password: {ADMIN_PASSWORD}')
    print(f'   Role: Superuser (full access)')
    
    print(f'\n👤 Agent Login Credentials:')
    print(f'   Username: {AGENT_USERNAME}')
    print(f'   Password: {AGENT_PASSWORD}')
    print(f'   Role: Staff (agency access)')
    
    print(f'\n📊 Structure:')
    print(f'   Organization: {org.name} (ID: {org.id})')
    print(f'   └── Branch: {branch.name} (ID: {branch.id})')
    print(f'       └── Agency: {agency.name} (ID: {agency.id})')
    
    print('\n' + '='*70)


if __name__ == '__main__':
    setup_fresh_organization()
