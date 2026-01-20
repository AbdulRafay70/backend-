"""
Script to count admin and agent permissions.
Run with: python count_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n📊 Counting Admin and Agent Permissions...\n', flush=True)

    try:
        # Get all permissions
        all_permissions = Permission.objects.all()

        # Count admin permissions (ending with _admin)
        admin_perms = [p for p in all_permissions if p.codename.endswith('_admin')]
        
        # Count agent permissions (ending with _agent)
        agent_perms = [p for p in all_permissions if p.codename.endswith('_agent')]
        
        # Total
        total_perms = len(admin_perms) + len(agent_perms)

        print(f'📋 Admin Permissions: {len(admin_perms)}', flush=True)
        print(f'👤 Agent Permissions: {len(agent_perms)}', flush=True)
        print(f'📊 Total Permissions: {total_perms}', flush=True)

        print(f'\n✅ Permission count complete!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
