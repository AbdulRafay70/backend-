"""
Script to delete view, edit, and delete permissions for Universal Registration.
Keep only add permissions.
Run with: python delete_universal_registration_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🗑️ Deleting view, edit, and delete permissions for Universal Registration...\n', flush=True)

    try:
        components = ['organization', 'branch', 'agency', 'employee']
        actions_to_delete = ['view', 'edit', 'delete']
        
        deleted_count = 0
        
        for component in components:
            for action in actions_to_delete:
                codename = f'{action}_{component}_admin'
                
                # Try to find and delete the permission
                try:
                    perm = Permission.objects.get(codename=codename)
                    perm_name = perm.name
                    perm.delete()
                    print(f'✅ Deleted: {codename} - {perm_name}', flush=True)
                    deleted_count += 1
                except Permission.DoesNotExist:
                    print(f'⚠️  Not found: {codename}', flush=True)
        
        print(f'\n✅ Successfully deleted {deleted_count} permissions!', flush=True)
        
        # Verify remaining permissions
        print(f'\n📊 Remaining Universal Registration permissions:', flush=True)
        for component in components:
            remaining = Permission.objects.filter(codename__contains=f'{component}_admin')
            print(f'  {component.capitalize()}: {remaining.count()} permission(s)', flush=True)
            for perm in remaining:
                print(f'    • {perm.codename}', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
