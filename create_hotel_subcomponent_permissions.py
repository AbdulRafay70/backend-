"""
Script to create CRUD permissions for Hotel sub-components (Availability, Outsourcing, Floor Management).
These are admin-only permissions.
Run with: python create_hotel_subcomponent_permissions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from tickets.models import Hotels

def main():
    print('\n🔧 Creating permissions for Hotel sub-components...\n', flush=True)

    try:
        # Get content type for Hotels model (we'll use the same content type)
        hotel_content_type = ContentType.objects.get_for_model(Hotels)

        # Define permissions to create for each sub-component
        sub_components = ['availability', 'outsourcing', 'floor_management']
        sub_component_names = {
            'availability': 'Hotel Availability',
            'outsourcing': 'Hotel Outsourcing',
            'floor_management': 'Hotel Floor Management'
        }

        permissions_to_create = []

        for component in sub_components:
            component_name = sub_component_names[component]
            
            # Add CRUD permissions for each component (admin only)
            permissions_to_create.extend([
                {
                    'codename': f'view_{component}_admin',
                    'name': f'Can view {component_name.lower()} in admin portal',
                    'type': 'view',
                    'component': component_name
                },
                {
                    'codename': f'add_{component}_admin',
                    'name': f'Can add {component_name.lower()} in admin portal',
                    'type': 'add',
                    'component': component_name
                },
                {
                    'codename': f'edit_{component}_admin',
                    'name': f'Can edit {component_name.lower()} in admin portal',
                    'type': 'edit',
                    'component': component_name
                },
                {
                    'codename': f'delete_{component}_admin',
                    'name': f'Can delete {component_name.lower()} in admin portal',
                    'type': 'delete',
                    'component': component_name
                },
            ])

        created_permissions = {
            'availability': [],
            'outsourcing': [],
            'floor_management': []
        }

        for perm_data in permissions_to_create:
            # Create or get the permission
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=hotel_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'✅ Created permission: {permission.name} ({permission.codename})', flush=True)
            else:
                print(f'ℹ️  Permission already exists: {permission.name} ({permission.codename})', flush=True)

            # Create permission extension
            perm_ext, ext_created = PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )
            
            if ext_created:
                print(f'   ✅ Created permission extension (type: {perm_data["type"]})', flush=True)

            # Determine which component this belongs to
            for comp in sub_components:
                if comp in perm_data['codename']:
                    created_permissions[comp].append({
                        'id': permission.id,
                        'codename': permission.codename,
                        'name': permission.name,
                        'type': perm_data['type']
                    })
                    break

        print('\n✅ Successfully created all hotel sub-component permissions!', flush=True)
        
        # Summary for each component
        for comp in sub_components:
            comp_name = sub_component_names[comp]
            print(f'\n📊 {comp_name} Permissions ({len(created_permissions[comp])} total):', flush=True)
            for perm in created_permissions[comp]:
                print(f'  • [{perm["type"].upper()}] {perm["name"]}', flush=True)
                print(f'    Codename: {perm["codename"]} | ID: {perm["id"]}', flush=True)

        print(f'\n💡 Note: These are admin-only permissions. View permission will be automatically checked when add/edit/delete is selected.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
