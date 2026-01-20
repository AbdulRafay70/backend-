"""
Script to delete Daily Operations agent permissions and create Pax Movement agent view permission.
Delete: 6 Daily Operations agent permissions
Create: 1 Pax Movement agent view permission
Run with: python update_agent_pax_permissions.py
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
    print('\n🔧 Updating agent permissions for Pax Movement...\n', flush=True)

    try:
        # Step 1: Delete Daily Operations agent permissions
        print('Step 1: Deleting Daily Operations agent permissions...', flush=True)
        permissions_to_delete = [
            'view_hotel_checkin_agent',
            'view_ziyarat_operations_agent',
            'view_transport_operations_agent',
            'view_airport_operations_agent',
            'view_food_operations_agent',
            'view_pax_details_agent'
        ]

        deleted_count = 0
        for codename in permissions_to_delete:
            try:
                perm = Permission.objects.get(codename=codename)
                perm_name = perm.name
                perm.delete()
                print(f'  ❌ Deleted: {codename}', flush=True)
                deleted_count += 1
            except Permission.DoesNotExist:
                print(f'  ⚠️  Not found: {codename}', flush=True)

        print(f'\n  📊 Deleted {deleted_count} permissions', flush=True)

        # Step 2: Create Pax Movement agent view permission
        print('\nStep 2: Creating Pax Movement agent view permission...', flush=True)
        
        movement_content_type = ContentType.objects.get_for_model(MovementLog)
        
        pax_perm, created = Permission.objects.get_or_create(
            codename='view_pax_movement_agent',
            content_type=movement_content_type,
            defaults={'name': 'Can view pax movement in agent portal'}
        )
        
        if created:
            print(f'  ✅ Created: {pax_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {pax_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=pax_perm,
            defaults={'type': 'view'}
        )

        print(f'\n✅ Successfully updated agent permissions!', flush=True)
        print(f'\n📊 Summary:', flush=True)
        print(f'  • Daily Operations permissions deleted: {deleted_count}', flush=True)
        print(f'  • Pax Movement view permission: {pax_perm.codename} (ID: {pax_perm.id})', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
