"""
Script to create HR sub-component permissions (admin only).
Sub-components: Employees, Attendance, Movements, Commission, Punctuality, Approvals, Payments
Each has CRUD permissions: view, add, edit, delete
Run with: python create_hr_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from django.contrib.auth.models import User

def main():
    print('\n🔧 Creating permissions for HR sub-components...\n', flush=True)

    try:
        # Use User model as content type for HR operations
        user_content_type = ContentType.objects.get_for_model(User)

        # Define sub-components with CRUD permissions
        sub_components = {
            'employees': {
                'label': 'Employees',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'attendance': {
                'label': 'Attendance',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'movements': {
                'label': 'Movements',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'commission': {
                'label': 'Commission',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'punctuality': {
                'label': 'Punctuality',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'approvals': {
                'label': 'Approvals',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'payments': {
                'label': 'Payments',
                'permissions': ['view', 'add', 'edit', 'delete']
            }
        }

        created_permissions = {key: [] for key in sub_components.keys()}
        total_count = 0

        # Create permissions for each sub-component
        for component_key, component_data in sub_components.items():
            print(f'\n📋 Creating permissions for {component_data["label"]}...', flush=True)
            
            for perm_type in component_data['permissions']:
                codename = f'{perm_type}_{component_key}_admin'
                name = f'Can {perm_type} {component_data["label"].lower()} in admin portal'
                
                # Create or get the permission
                permission, created = Permission.objects.get_or_create(
                    codename=codename,
                    content_type=user_content_type,
                    defaults={'name': name}
                )
                
                if created:
                    print(f'  ✅ Created: {permission.codename}', flush=True)
                else:
                    print(f'  ℹ️  Exists: {permission.codename}', flush=True)

                # Create permission extension
                perm_ext, ext_created = PermissionExtension.objects.get_or_create(
                    permission=permission,
                    defaults={'type': perm_type}
                )

                created_permissions[component_key].append({
                    'id': permission.id,
                    'codename': permission.codename,
                    'name': permission.name,
                    'type': perm_type
                })
                total_count += 1

        print('\n✅ Successfully created all HR permissions!', flush=True)
        
        # Summary for each component
        for comp_key, comp_data in sub_components.items():
            comp_perms = created_permissions[comp_key]
            print(f'\n📊 {comp_data["label"]} - {len(comp_perms)} permissions:', flush=True)
            for perm in comp_perms:
                print(f'  • [{perm["type"].upper()}] {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n📊 Total Permissions Created: {total_count}', flush=True)
        print(f'\n💡 Note: These are admin-only CRUD permissions.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
