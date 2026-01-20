"""
Script to list all current agent permissions.
Run with: python list_agent_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n📋 Listing all agent permissions...\n', flush=True)

    try:
        # Get all agent permissions
        agent_permissions = Permission.objects.filter(codename__endswith='_agent').order_by('codename')
        
        total_count = agent_permissions.count()
        
        print(f'Found {total_count} agent permissions:\n', flush=True)

        for perm in agent_permissions:
            print(f'  • {perm.codename}', flush=True)
            print(f'    Name: {perm.name}', flush=True)
            print(f'    ID: {perm.id}', flush=True)
            print(f'    Content Type: {perm.content_type}\n', flush=True)

        print(f'📊 Total: {total_count} agent permissions', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
