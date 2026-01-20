"""
Script to delete all Universal Registration permissions.
Delete: add_organization_admin, add_agency_admin, add_branch_registration_admin
Run with: python delete_universal_registration_all.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🗑️ Deleting Universal Registration permissions...\n', flush=True)

    try:
        # Permissions to delete
        permissions_to_delete = [
            'add_organization_admin',
            'add_agency_admin',
            'add_branch_registration_admin'
        ]

        deleted_count = 0

        for codename in permissions_to_delete:
            try:
                perm = Permission.objects.get(codename=codename)
                perm_name = perm.name
                perm.delete()
                print(f'✅ Deleted: {codename} - {perm_name}', flush=True)
                deleted_count += 1
            except Permission.DoesNotExist:
                print(f'⚠️  Not found: {codename}', flush=True)

        print(f'\n📊 Summary:', flush=True)
        print(f'  • Permissions deleted: {deleted_count}', flush=True)

        print(f'\n✅ Successfully deleted all Universal Registration permissions!', flush=True)
        print(f'\n💡 Note: You can recreate them later when needed.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
