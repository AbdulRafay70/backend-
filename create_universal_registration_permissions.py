"""
Script to create CRUD permissions for Universal Registration sub-components (admin only).
Sub-components: Organization, Branch, Agency, Employee
Run with: python create_universal_registration_permissions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from organization.models import Organization, Branch, Agency
from django.contrib.auth.models import User

def main():
    print('\n🔧 Creating permissions for Universal Registration sub-components...\n', flush=True)

    try:
        # Get content types for each model
        org_content_type = ContentType.objects.get_for_model(Organization)
        branch_content_type = ContentType.objects.get_for_model(Branch)
        agency_content_type = ContentType.objects.get_for_model(Agency)
        user_content_type = ContentType.objects.get_for_model(User)

        # Define sub-components and their content types
        sub_components = {
            'organization': {
                'content_type': org_content_type,
                'label': 'Organization',
                'description': 'Main organization/company'
            },
            'branch': {
                'content_type': branch_content_type,
                'label': 'Branch',
                'description': 'Branch under organization'
            },
            'agency': {
                'content_type': agency_content_type,
                'label': 'Agency',
                'description': 'Agency under branch'
            },
            'employee': {
                'content_type': user_content_type,
                'label': 'Employee',
                'description': 'Employee (org/branch)'
            }
        }

        created_permissions = {
            'organization': [],
            'branch': [],
            'agency': [],
            'employee': []
        }

        # Create CRUD permissions for each sub-component
        for component_key, component_data in sub_components.items():
            print(f'\n📋 Creating permissions for {component_data["label"]}...', flush=True)
            
            permissions_to_create = [
                {
                    'codename': f'view_{component_key}_admin',
                    'name': f'Can view {component_data["label"].lower()} in admin portal',
                    'type': 'view'
                },
                {
                    'codename': f'add_{component_key}_admin',
                    'name': f'Can add {component_data["label"].lower()} in admin portal',
                    'type': 'add'
                },
                {
                    'codename': f'edit_{component_key}_admin',
                    'name': f'Can edit {component_data["label"].lower()} in admin portal',
                    'type': 'edit'
                },
                {
                    'codename': f'delete_{component_key}_admin',
                    'name': f'Can delete {component_data["label"].lower()} in admin portal',
                    'type': 'delete'
                },
            ]

            for perm_data in permissions_to_create:
                # Create or get the permission
                permission, created = Permission.objects.get_or_create(
                    codename=perm_data['codename'],
                    content_type=component_data['content_type'],
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

        print('\n✅ Successfully created all Universal Registration permissions!', flush=True)
        
        # Summary for each component
        total_count = 0
        for comp_key, comp_data in sub_components.items():
            comp_perms = created_permissions[comp_key]
            total_count += len(comp_perms)
            print(f'\n📊 {comp_data["label"]} ({comp_data["description"]}) - {len(comp_perms)} permissions:', flush=True)
            for perm in comp_perms:
                print(f'  • [{perm["type"].upper()}] {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n📊 Total Permissions Created: {total_count}', flush=True)
        print(f'\n💡 Note: These are admin-only permissions. View permission will be automatically checked when add/edit/delete is selected.', flush=True)
        print(f'💡 No agent permissions created as requested.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
