"""
Script to create agent-specific permissions for Packages.
Run with: python create_agent_package_permissions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from packages.models import UmrahPackage

def main():
    print('\n🔧 Creating agent-specific permissions for Packages...\n', flush=True)

    try:
        # Get content type for UmrahPackage model
        package_content_type = ContentType.objects.get_for_model(UmrahPackage)

        # Define agent permissions for packages
        permissions_to_create = [
            {
                'codename': 'view_package_agent',
                'name': 'Can view packages in agent portal',
                'type': 'view'
            },
            {
                'codename': 'book_package_agent',
                'name': 'Can book packages in agent portal',
                'type': 'book'
            },
        ]

        created_permissions = []

        for perm_data in permissions_to_create:
            # Create or get the permission
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=package_content_type,
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

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'type': perm_data['type']
            })

        print('\n✅ Successfully created all agent package permissions!', flush=True)
        print(f'\n📊 Summary:', flush=True)
        print(f'  Total permissions created/verified: {len(created_permissions)}', flush=True)
        print(f'\n📋 Permissions List:', flush=True)
        for perm in created_permissions:
            print(f'  • [{perm["type"].upper()}] {perm["name"]}', flush=True)
            print(f'    Codename: {perm["codename"]} | ID: {perm["id"]}', flush=True)

        print(f'\n💡 Note: The view permission will be automatically checked when book is selected.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
