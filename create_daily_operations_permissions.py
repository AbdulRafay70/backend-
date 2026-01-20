"""
Script to create view and update permissions for Daily Operations sub-components (admin only).
Sub-components: Hotel Check-in/Check-out, Ziyarat, Transport, Airport, Food, Pax Details
Run with: python create_daily_operations_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from booking.models import Booking

def main():
    print('\n🔧 Creating permissions for Daily Operations sub-components...\n', flush=True)

    try:
        # Use Booking model as content type for all daily operations
        booking_content_type = ContentType.objects.get_for_model(Booking)

        # Define sub-components
        sub_components = {
            'hotel_checkin': {
                'label': 'Hotel Check-in/Check-out',
                'description': 'Hotel check-in and check-out operations'
            },
            'ziyarat_operations': {
                'label': 'Ziyarat',
                'description': 'Ziyarat operations'
            },
            'transport_operations': {
                'label': 'Transport',
                'description': 'Transport operations'
            },
            'airport_operations': {
                'label': 'Airport',
                'description': 'Airport operations'
            },
            'food_operations': {
                'label': 'Food',
                'description': 'Food operations'
            },
            'pax_details': {
                'label': 'Pax Details',
                'description': 'Passenger details operations'
            }
        }

        created_permissions = {key: [] for key in sub_components.keys()}

        # Create view and update permissions for each sub-component
        for component_key, component_data in sub_components.items():
            print(f'\n📋 Creating permissions for {component_data["label"]}...', flush=True)
            
            permissions_to_create = [
                {
                    'codename': f'view_{component_key}_admin',
                    'name': f'Can view {component_data["label"].lower()} in admin portal',
                    'type': 'view'
                },
                {
                    'codename': f'update_{component_key}_admin',
                    'name': f'Can update {component_data["label"].lower()} in admin portal',
                    'type': 'update'
                }
            ]

            for perm_data in permissions_to_create:
                # Create or get the permission
                permission, created = Permission.objects.get_or_create(
                    codename=perm_data['codename'],
                    content_type=booking_content_type,
                    defaults={'name': perm_data['name']}
                )
                
                if created:
                    print(f'  ✅ Created: {permission.codename}', flush=True)
                else:
                    print(f'  ℹ️  Exists: {permission.codename}', flush=True)

                # Create permission extension
                perm_ext, ext_created = PermissionExtension.objects.get_or_create(
                    permission=permission,
                    defaults={'type': perm_data['type']}
                )

                created_permissions[component_key].append({
                    'id': permission.id,
                    'codename': permission.codename,
                    'name': permission.name,
                    'type': perm_data['type']
                })

        print('\n✅ Successfully created all Daily Operations permissions!', flush=True)
        
        # Summary for each component
        total_count = 0
        for comp_key, comp_data in sub_components.items():
            comp_perms = created_permissions[comp_key]
            total_count += len(comp_perms)
            print(f'\n📊 {comp_data["label"]} - {len(comp_perms)} permissions:', flush=True)
            for perm in comp_perms:
                print(f'  • [{perm["type"].upper()}] {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n📊 Total Permissions Created: {total_count}', flush=True)
        print(f'\n💡 Note: These are admin-only permissions (view and update only).', flush=True)
        print(f'💡 No agent permissions created as requested.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
