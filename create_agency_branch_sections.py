"""
Script to create Agency and Branch (physical branches) sections for Partners.
Agency: CRUD (4 permissions)
Branch: CRUD (4 permissions)
Run with: python create_agency_branch_sections.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from organization.models import Agency, Branch

def main():
    print('\n🔧 Creating Agency and Branch sections for Partners...\n', flush=True)

    try:
        # Get content types
        agency_content_type = ContentType.objects.get_for_model(Agency)
        branch_content_type = ContentType.objects.get_for_model(Branch)

        created_permissions = []

        # Section 1: Agency CRUD permissions
        print('Section 1: Creating Agency CRUD permissions...', flush=True)
        agency_perms = [
            {'codename': 'view_agency_admin', 'name': 'Can view agency in admin portal', 'type': 'view'},
            {'codename': 'add_agency_admin', 'name': 'Can add agency in admin portal', 'type': 'add'},
            {'codename': 'edit_agency_admin', 'name': 'Can edit agency in admin portal', 'type': 'edit'},
            {'codename': 'delete_agency_admin', 'name': 'Can delete agency in admin portal', 'type': 'delete'}
        ]

        for perm_data in agency_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=agency_content_type,
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
                'section': 'Agency'
            })

        # Section 2: Branch CRUD permissions
        print('\nSection 2: Creating Branch CRUD permissions...', flush=True)
        branch_perms = [
            {'codename': 'view_branch_admin', 'name': 'Can view branch in admin portal', 'type': 'view'},
            {'codename': 'add_branch_admin', 'name': 'Can add branch in admin portal', 'type': 'add'},
            {'codename': 'edit_branch_admin', 'name': 'Can edit branch in admin portal', 'type': 'edit'},
            {'codename': 'delete_branch_admin', 'name': 'Can delete branch in admin portal', 'type': 'delete'}
        ]

        for perm_data in branch_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=branch_content_type,
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
                'section': 'Branch'
            })

        print('\n✅ Successfully created Agency and Branch sections!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        
        print(f'\n🏛️ Agency Section (4 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Agency']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n🏪 Branch Section (4 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Branch']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Partners now has:', flush=True)
        print(f'  • Add Users: 6 permissions', flush=True)
        print(f'  • Organization: 4 permissions (CRUD)', flush=True)
        print(f'  • Groups: 5 permissions (CRUD + assign)', flush=True)
        print(f'  • Agency: 4 permissions (CRUD)', flush=True)
        print(f'  • Branch: 4 permissions (CRUD)', flush=True)
        print(f'  • 6 User Types: 3 permissions each (18 total)', flush=True)
        print(f'  • Total: 41 permissions', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
