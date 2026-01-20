"""
Script to delete Ziyarat admin permissions.
Delete: add_pax_transport_ziyarat_admin, delete_pax_transport_ziyarat_admin, 
        edit_pax_transport_ziyarat_admin, view_pax_transport_ziyarat_admin
Run with: python delete_ziyarat_admin_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🗑️ Deleting Ziyarat admin permissions...\n', flush=True)

    try:
        # Permissions to delete
        permissions_to_delete = [
            'add_pax_transport_ziyarat_admin',
            'delete_pax_transport_ziyarat_admin',
            'edit_pax_transport_ziyarat_admin',
            'view_pax_transport_ziyarat_admin'
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

        print(f'\n✅ Successfully deleted Ziyarat admin permissions!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
