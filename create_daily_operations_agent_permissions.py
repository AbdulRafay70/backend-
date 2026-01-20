"""
Script to create agent view-only permissions for Daily Operations sub-components.
Sub-components: Hotel Check-in/Check-out, Ziyarat, Transport, Airport, Food, Pax Details
Run with: python create_daily_operations_agent_permissions.py
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
    print('\n🔧 Creating agent view-only permissions for Daily Operations...\n', flush=True)

    try:
        # Use Booking model as content type
        booking_content_type = ContentType.objects.get_for_model(Booking)

        # Define view-only permissions for each sub-component
        sub_components = [
            {'key': 'hotel_checkin', 'label': 'Hotel Check-in/Check-out'},
            {'key': 'ziyarat_operations', 'label': 'Ziyarat'},
            {'key': 'transport_operations', 'label': 'Transport'},
            {'key': 'airport_operations', 'label': 'Airport'},
            {'key': 'food_operations', 'label': 'Food'},
            {'key': 'pax_details', 'label': 'Pax Details'}
        ]

        created_permissions = []

        for comp in sub_components:
            codename = f'view_{comp["key"]}_agent'
            name = f'Can view {comp["label"].lower()} in agent portal'
            
            # Create or get the permission
            permission, created = Permission.objects.get_or_create(
                codename=codename,
                content_type=booking_content_type,
                defaults={'name': name}
            )
            
            if created:
                print(f'✅ Created: {permission.codename}', flush=True)
            else:
                print(f'ℹ️  Exists: {permission.codename}', flush=True)

            # Create permission extension
            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': 'view'}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'label': comp['label']
            })

        print('\n✅ Successfully created all Daily Operations agent permissions!', flush=True)
        
        print(f'\n📊 Agent View-Only Permissions ({len(created_permissions)} total):', flush=True)
        for perm in created_permissions:
            print(f'  • {perm["label"]}: {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Note: These are agent view-only permissions for Daily Operations.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
