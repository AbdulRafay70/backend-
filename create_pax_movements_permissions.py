"""
Script to delete old pax movement permission and create new Pax Movements structure.
- Delete old view_pax_movement_admin permission
- Create agent CRUD permissions for Pax Movements
- Create view-only permissions for sub-components: Hotels, Transport & Ziyarat, Flights, All Passengers
Run with: python create_pax_movements_permissions.py
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
    print('\n🔧 Updating Pax Movements permissions...\n', flush=True)

    try:
        movement_content_type = ContentType.objects.get_for_model(MovementLog)

        # Step 1: Delete old permission
        print('Step 1: Deleting old pax movement permission...', flush=True)
        try:
            old_perm = Permission.objects.get(codename='view_pax_movement_admin')
            old_perm.delete()
            print('✅ Deleted: view_pax_movement_admin\n', flush=True)
        except Permission.DoesNotExist:
            print('ℹ️  Old permission not found, skipping...\n', flush=True)

        # Step 2: Create agent CRUD permissions for Pax Movements
        print('Step 2: Creating agent CRUD permissions for Pax Movements...', flush=True)
        agent_permissions = [
            {'codename': 'view_pax_movements_agent', 'name': 'Can view pax movements in agent portal', 'type': 'view'},
            {'codename': 'add_pax_movements_agent', 'name': 'Can add pax movements in agent portal', 'type': 'add'},
            {'codename': 'edit_pax_movements_agent', 'name': 'Can edit pax movements in agent portal', 'type': 'edit'},
            {'codename': 'delete_pax_movements_agent', 'name': 'Can delete pax movements in agent portal', 'type': 'delete'}
        ]

        created_agent = []
        for perm_data in agent_permissions:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=movement_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )
            created_agent.append({'id': permission.id, 'codename': permission.codename, 'name': permission.name})

        # Step 3: Create view-only sub-component permissions
        print('\nStep 3: Creating view-only sub-component permissions...', flush=True)
        sub_components = [
            {'key': 'hotels_movements', 'label': 'Hotels'},
            {'key': 'transport_ziyarat_movements', 'label': 'Transport & Ziyarat'},
            {'key': 'flights_movements', 'label': 'Flights'},
            {'key': 'all_passengers_movements', 'label': 'All Passengers'}
        ]

        created_subs = {}
        for comp in sub_components:
            codename = f'view_{comp["key"]}_agent'
            name = f'Can view {comp["label"].lower()} in agent portal'
            
            permission, created = Permission.objects.get_or_create(
                codename=codename,
                content_type=movement_content_type,
                defaults={'name': name}
            )
            
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': 'view'}
            )
            created_subs[comp['key']] = {'id': permission.id, 'codename': permission.codename, 'name': permission.name}

        print('\n✅ Successfully updated Pax Movements permissions!', flush=True)
        
        print(f'\n📊 Agent CRUD Permissions for Pax Movements ({len(created_agent)} total):', flush=True)
        for perm in created_agent:
            print(f'  • {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n📊 View-Only Sub-component Permissions ({len(created_subs)} total):', flush=True)
        for key, perm in created_subs.items():
            print(f'  • {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Total new permissions: {len(created_agent) + len(created_subs)}', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
