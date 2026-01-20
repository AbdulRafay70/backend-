"""
Script to find portal access permissions.
Run with: python find_portal_access.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🔍 Finding portal access permissions...\n', flush=True)

    try:
        # Search for portal access permissions
        portal_perms = Permission.objects.filter(codename__icontains='portal')
        
        print(f'Found {portal_perms.count()} portal access permissions:\n', flush=True)

        for perm in portal_perms:
            print(f'  • {perm.codename}', flush=True)
            print(f'    Name: {perm.name}', flush=True)
            print(f'    ID: {perm.id}', flush=True)
            print(f'    Content Type: {perm.content_type}\n', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
