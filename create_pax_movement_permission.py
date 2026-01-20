"""
Script to create view-only permission for Pax Movement & Intimation (admin only).
Run with: python create_pax_movement_permission.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from hr.models import MovementLog

def main():
    print('\n🔧 Creating view permission for Pax Movement & Intimation (Admin only)...\n', flush=True)

    try:
        # Get content type for MovementLog model
        movement_content_type = ContentType.objects.get_for_model(MovementLog)

        # Create view-only permission
        permission, created = Permission.objects.get_or_create(
            codename='view_pax_movement_admin',
            content_type=movement_content_type,
            defaults={'name': 'Can view pax movement & intimation in admin portal'}
        )
        
        if created:
            print(f'✅ Created permission: {permission.name} ({permission.codename})', flush=True)
        else:
            print(f'ℹ️  Permission already exists: {permission.name} ({permission.codename})', flush=True)

        # Create permission extension
        perm_ext, ext_created = PermissionExtension.objects.get_or_create(
            permission=permission,
            defaults={'type': 'view'}
        )
        
        if ext_created:
            print(f'   ✅ Created permission extension (type: view)', flush=True)

        print(f'\n✅ Successfully created Pax Movement & Intimation permission!', flush=True)
        print(f'\n📊 Permission Details:', flush=True)
        print(f'  • Codename: {permission.codename}', flush=True)
        print(f'  • Name: {permission.name}', flush=True)
        print(f'  • ID: {permission.id}', flush=True)
        print(f'  • Type: view', flush=True)

        print(f'\n💡 Note: This is a view-only, admin-only permission.', flush=True)
        print(f'💡 No agent permission created as requested.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
