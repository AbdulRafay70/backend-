"""
Script to check for duplicate permissions and list all Partners permissions.
Run with: python check_partners_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from collections import defaultdict

def main():
    print('\n🔍 Checking Partners permissions...\n', flush=True)

    try:
        # Get all permissions with keywords related to Partners
        keywords = ['super_admin', 'admin_admin', 'agent_admin', 'area_agent', 'employee', 'branch', 'add_users']
        
        all_perms = []
        for keyword in keywords:
            perms = Permission.objects.filter(codename__icontains=keyword, codename__endswith='_admin')
            all_perms.extend(perms)

        # Check for duplicates by codename
        codename_count = defaultdict(list)
        for perm in all_perms:
            codename_count[perm.codename].append(perm)

        print('📊 Checking for duplicates...\n', flush=True)
        duplicates_found = False
        for codename, perms in codename_count.items():
            if len(perms) > 1:
                duplicates_found = True
                print(f'⚠️  DUPLICATE: {codename} (found {len(perms)} times)', flush=True)
                for perm in perms:
                    print(f'    ID: {perm.id}, Name: {perm.name}', flush=True)

        if not duplicates_found:
            print('✅ No duplicates found!', flush=True)

        # List all Partners permissions grouped by type
        print('\n📋 All Partners Permissions:\n', flush=True)
        
        # Group by category
        add_users_perms = [p for p in all_perms if 'add_users' in p.codename or '_users_' in p.codename]
        super_admin_perms = [p for p in all_perms if 'super_admin' in p.codename and '_users_' not in p.codename]
        admin_perms = [p for p in all_perms if 'admin_admin' in p.codename and '_users_' not in p.codename]
        agent_perms = [p for p in all_perms if 'agent_admin' in p.codename and 'area' not in p.codename and '_users_' not in p.codename]
        area_agent_perms = [p for p in all_perms if 'area_agent' in p.codename and '_users_' not in p.codename]
        employee_perms = [p for p in all_perms if 'employee' in p.codename and '_users_' not in p.codename]
        branch_perms = [p for p in all_perms if 'branch' in p.codename and '_users_' not in p.codename]

        print(f'👥 Add Users ({len(add_users_perms)} permissions):', flush=True)
        for p in add_users_perms:
            print(f'  • {p.codename} (ID: {p.id})', flush=True)

        print(f'\n👑 Super Admin ({len(super_admin_perms)} permissions):', flush=True)
        for p in super_admin_perms:
            print(f'  • {p.codename} (ID: {p.id})', flush=True)

        print(f'\n🔑 Admin ({len(admin_perms)} permissions):', flush=True)
        for p in admin_perms:
            print(f'  • {p.codename} (ID: {p.id})', flush=True)

        print(f'\n👤 Agent ({len(agent_perms)} permissions):', flush=True)
        for p in agent_perms:
            print(f'  • {p.codename} (ID: {p.id})', flush=True)

        print(f'\n📍 Area Agent ({len(area_agent_perms)} permissions):', flush=True)
        for p in area_agent_perms:
            print(f'  • {p.codename} (ID: {p.id})', flush=True)

        print(f'\n👨‍💼 Employee ({len(employee_perms)} permissions):', flush=True)
        for p in employee_perms:
            print(f'  • {p.codename} (ID: {p.id})', flush=True)

        print(f'\n🏪 Branch ({len(branch_perms)} permissions):', flush=True)
        for p in branch_perms:
            print(f'  • {p.codename} (ID: {p.id})', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
