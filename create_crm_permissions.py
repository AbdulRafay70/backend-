"""
Script to create permissions for CRM sub-components (admin only).
Sub-components:
- Leads (CRUD: view, add, edit, delete)
- Loan (CRUD: view, add, edit, delete)
- Tasks (CRUD: view, add, edit, delete)
- Closed Leads (view only)
- Instant (view only)
Run with: python create_crm_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from leads.models import Lead

def main():
    print('\n🔧 Creating permissions for CRM sub-components...\n', flush=True)

    try:
        # Use Lead model as content type for all CRM operations
        lead_content_type = ContentType.objects.get_for_model(Lead)

        # Define sub-components with their permission types
        sub_components = {
            'leads': {
                'label': 'Leads',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'loan': {
                'label': 'Loan',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'tasks': {
                'label': 'Tasks',
                'permissions': ['view', 'add', 'edit', 'delete']
            },
            'closed_leads': {
                'label': 'Closed Leads',
                'permissions': ['view']
            },
            'instant': {
                'label': 'Instant',
                'permissions': ['view']
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
                    content_type=lead_content_type,
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

        print('\n✅ Successfully created all CRM permissions!', flush=True)
        
        # Summary for each component
        for comp_key, comp_data in sub_components.items():
            comp_perms = created_permissions[comp_key]
            print(f'\n📊 {comp_data["label"]} - {len(comp_perms)} permission(s):', flush=True)
            for perm in comp_perms:
                print(f'  • [{perm["type"].upper()}] {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n📊 Total Permissions Created: {total_count}', flush=True)
        print(f'\n💡 Note: These are admin-only permissions.', flush=True)
        print(f'💡 Leads, Loan, Tasks have CRUD permissions.', flush=True)
        print(f'💡 Closed Leads and Instant have view-only permissions.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
