"""
Script to delete add, edit, delete permissions for all passengers admin.
Keep only: view_pax_all_passengers_admin
Run with: python delete_pax_all_passengers_crud.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🗑️ Deleting add, edit, delete permissions for all passengers admin...\n', flush=True)

    try:
        # Permissions to delete
        permissions_to_delete = [
            'add_pax_all_passengers_admin',
            'edit_pax_all_passengers_admin',
            'delete_pax_all_passengers_admin'
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

        # Check remaining permission
        print(f'\n💡 Remaining permission:', flush=True)
        try:
            view_perm = Permission.objects.get(codename='view_pax_all_passengers_admin')
            print(f'  ✅ KEPT: {view_perm.codename} - {view_perm.name}', flush=True)
        except Permission.DoesNotExist:
            print(f'  ⚠️  view_pax_all_passengers_admin not found!', flush=True)

        print(f'\n✅ Successfully cleaned up all passengers admin permissions!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
