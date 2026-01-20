"""
Script to verify Universal Registration permissions were created.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n📊 Verifying Universal Registration Permissions...\n', flush=True)
    
    components = ['organization', 'branch', 'agency', 'employee']
    total = 0
    
    for comp in components:
        perms = Permission.objects.filter(codename__contains=f'{comp}_admin')
        print(f'✅ {comp.capitalize()}: {perms.count()} permissions', flush=True)
        for perm in perms:
            print(f'   • {perm.codename} (ID: {perm.id})', flush=True)
        total += perms.count()
    
    print(f'\n📊 Total: {total} permissions', flush=True)

if __name__ == '__main__':
    main()
