"""
Script to delete all agent permissions except packages and login.
Keep only: agent_portal_access, view_package_agent, book_package_agent
Run with: python delete_agent_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🗑️ Deleting agent permissions (keeping only packages and login)...\n', flush=True)

    try:
        # Permissions to keep
        keep_permissions = [
            'agent_portal_access',
            'view_package_agent',
            'book_package_agent'
        ]

        # Get all agent permissions
        agent_permissions = Permission.objects.filter(codename__endswith='_agent')
        
        total_count = agent_permissions.count()
        deleted_count = 0
        kept_count = 0

        print(f'Found {total_count} agent permissions total.\n', flush=True)

        for perm in agent_permissions:
            if perm.codename in keep_permissions:
                print(f'✅ KEEPING: {perm.codename} - {perm.name}', flush=True)
                kept_count += 1
            else:
                print(f'❌ DELETING: {perm.codename} - {perm.name}', flush=True)
                perm.delete()
                deleted_count += 1

        print(f'\n📊 Summary:', flush=True)
        print(f'  • Total agent permissions found: {total_count}', flush=True)
        print(f'  • Permissions kept: {kept_count}', flush=True)
        print(f'  • Permissions deleted: {deleted_count}', flush=True)

        print(f'\n✅ Successfully cleaned up agent permissions!', flush=True)
        print(f'\n💡 Remaining agent permissions:', flush=True)
        for codename in keep_permissions:
            try:
                perm = Permission.objects.get(codename=codename)
                print(f'  • {perm.codename} - {perm.name}', flush=True)
            except Permission.DoesNotExist:
                print(f'  ⚠️  {codename} - NOT FOUND', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
