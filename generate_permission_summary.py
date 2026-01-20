"""
Script to generate a comprehensive permission summary showing admin and agent permissions separately.
Run with: python generate_permission_summary.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from collections import defaultdict

def main():
    print('\n📊 Generating Permission Summary...\n', flush=True)

    try:
        # Get all permissions
        all_permissions = Permission.objects.all().order_by('codename')

        # Separate admin and agent permissions
        admin_perms = defaultdict(list)
        agent_perms = defaultdict(list)
        
        for perm in all_permissions:
            if perm.codename.endswith('_admin'):
                # Extract category from permission name
                category = perm.codename.replace('_admin', '').split('_')[0].title()
                admin_perms[category].append(perm.codename)
            elif perm.codename.endswith('_agent'):
                category = perm.codename.replace('_agent', '').split('_')[0].title()
                agent_perms[category].append(perm.codename)

        # Print summary
        print('=' * 80, flush=True)
        print('📋 ADMIN PERMISSIONS', flush=True)
        print('=' * 80, flush=True)
        admin_total = 0
        for category in sorted(admin_perms.keys()):
            perms = admin_perms[category]
            print(f'\n{category} ({len(perms)} permissions):', flush=True)
            for perm in sorted(perms):
                print(f'  • {perm}', flush=True)
            admin_total += len(perms)
        
        print(f'\n📋 Total Admin Permissions: {admin_total}', flush=True)

        print('\n' + '=' * 80, flush=True)
        print('👤 AGENT PERMISSIONS', flush=True)
        print('=' * 80, flush=True)
        agent_total = 0
        for category in sorted(agent_perms.keys()):
            perms = agent_perms[category]
            print(f'\n{category} ({len(perms)} permissions):', flush=True)
            for perm in sorted(perms):
                print(f'  • {perm}', flush=True)
            agent_total += len(perms)
        
        print(f'\n👤 Total Agent Permissions: {agent_total}', flush=True)

        print('\n' + '=' * 80, flush=True)
        print(f'📊 GRAND TOTAL: {admin_total + agent_total} permissions', flush=True)
        print('=' * 80, flush=True)

        print(f'\n✅ Summary generation complete!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
