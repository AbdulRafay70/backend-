"""
Script to create Order Delivery section in Finance category.
3 permissions: view, update, display
Run with: python create_order_delivery_section.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension

def main():
    print('\n🔧 Creating Order Delivery section in Finance...\n', flush=True)

    try:
        # Use Group content type
        group_content_type = ContentType.objects.get_for_model(Group)

        created_permissions = []

        # Order Delivery - 3 permissions (view, update, display)
        print('Creating Order Delivery permissions...', flush=True)
        order_delivery_perms = [
            {'codename': 'view_order_delivery_admin', 'name': 'Can view order delivery in admin portal', 'type': 'view'},
            {'codename': 'update_order_delivery_admin', 'name': 'Can update order delivery in admin portal', 'type': 'edit'},
            {'codename': 'display_order_delivery_admin', 'name': 'Can display order delivery in admin portal', 'type': 'view'}
        ]
        
        for perm_data in order_delivery_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            if created:
                print(f'  ✅ Created: {permission.codename} (ID: {permission.id})', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename} (ID: {permission.id})', flush=True)
            PermissionExtension.objects.get_or_create(permission=permission, defaults={'type': perm_data['type']})
            created_permissions.append({'id': permission.id, 'codename': permission.codename})

        print(f'\n✅ Successfully created Order Delivery section!', flush=True)
        print(f'💡 Total: {len(created_permissions)} permissions created', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
