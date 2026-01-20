"""
Script to create Organization and Groups sub-sections for Partners.
Organization: CRUD (4 permissions)
Groups: CRUD + assign permissions (5 permissions)
Run with: python create_organization_groups_sections.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from organization.models import Organization

def main(): 
    print('\n🔧 Creating Organization and Groups sub-sections for Partners...\n', flush=True)

    try:
        # Get content types
        org_content_type = ContentType.objects.get_for_model(Organization)
        group_content_type = ContentType.objects.get_for_model(Group)

        created_permissions = []

        # Section 1: Organization CRUD permissions
        print('Section 1: Creating Organization CRUD permissions...', flush=True)
        org_perms = [
            {'codename': 'view_organization_admin', 'name': 'Can view organization in admin portal', 'type': 'view'},
            {'codename': 'add_organization_admin', 'name': 'Can add organization in admin portal', 'type': 'add'},
            {'codename': 'edit_organization_admin', 'name': 'Can edit organization in admin portal', 'type': 'edit'},
            {'codename': 'delete_organization_admin', 'name': 'Can delete organization in admin portal', 'type': 'delete'}
        ]

        for perm_data in org_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=org_content_type,
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

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'section': 'Organization'
            })

        # Section 2: Groups CRUD + assign permissions
        print('\nSection 2: Creating Groups CRUD + assign permissions...', flush=True)
        group_perms = [
            {'codename': 'view_groups_admin', 'name': 'Can view groups in admin portal', 'type': 'view'},
            {'codename': 'add_groups_admin', 'name': 'Can add groups in admin portal', 'type': 'add'},
            {'codename': 'edit_groups_admin', 'name': 'Can edit groups in admin portal', 'type': 'edit'},
            {'codename': 'delete_groups_admin', 'name': 'Can delete groups in admin portal', 'type': 'delete'},
            {'codename': 'assign_permissions_to_groups_admin', 'name': 'Can assign permissions to groups in admin portal', 'type': 'assign'}
        ]

        for perm_data in group_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
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

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'section': 'Groups'
            })

        print('\n✅ Successfully created Organization and Groups sections!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        
        print(f'\n🏢 Organization Section (4 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Organization']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n🔐 Groups Section (5 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Groups']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Partners now has:', flush=True)
        print(f'  • Add Users: 6 permissions', flush=True)
        print(f'  • Organization: 4 permissions (CRUD)', flush=True)
        print(f'  • Groups: 5 permissions (CRUD + assign)', flush=True)
        print(f'  • 6 User Types: 3 permissions each (18 total)', flush=True)
        print(f'  • Total: 33 permissions', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
