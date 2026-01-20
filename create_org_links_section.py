"""
Script to create Org Links section for Partners.
Create Resell Request: CRUD (4 permissions)
Create Link Org: CRUD (4 permissions)
Total: 8 permissions
Run with: python create_org_links_section.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension

def main():
    print('\n🔧 Creating Org Links section for Partners...\n', flush=True)

    try:
        # Use Group content type for org links
        group_content_type = ContentType.objects.get_for_model(Group)

        created_permissions = []

        # Create Resell Request CRUD permissions
        print('Creating Create Resell Request CRUD permissions...', flush=True)
        resell_perms = [
            {'codename': 'view_create_resell_request_admin', 'name': 'Can view create resell request in admin portal', 'type': 'view'},
            {'codename': 'add_create_resell_request_admin', 'name': 'Can add create resell request in admin portal', 'type': 'add'},
            {'codename': 'edit_create_resell_request_admin', 'name': 'Can edit create resell request in admin portal', 'type': 'edit'},
            {'codename': 'delete_create_resell_request_admin', 'name': 'Can delete create resell request in admin portal', 'type': 'delete'}
        ]

        for perm_data in resell_perms:
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
                'section': 'Create Resell Request'
            })

        # Create Link Org CRUD permissions
        print('\nCreating Create Link Org CRUD permissions...', flush=True)
        link_org_perms = [
            {'codename': 'view_create_link_org_admin', 'name': 'Can view create link org in admin portal', 'type': 'view'},
            {'codename': 'add_create_link_org_admin', 'name': 'Can add create link org in admin portal', 'type': 'add'},
            {'codename': 'edit_create_link_org_admin', 'name': 'Can edit create link org in admin portal', 'type': 'edit'},
            {'codename': 'delete_create_link_org_admin', 'name': 'Can delete create link org in admin portal', 'type': 'delete'}
        ]

        for perm_data in link_org_perms:
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
                'section': 'Create Link Org'
            })

        print('\n✅ Successfully created Org Links section!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        
        print(f'\n🔗 Create Resell Request (4 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Create Resell Request']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n🔗 Create Link Org (4 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Create Link Org']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Org Links section structure:', flush=True)
        print(f'  • Create Resell Request: 4 CRUD permissions', flush=True)
        print(f'  • Create Link Org: 4 CRUD permissions', flush=True)
        print(f'\n💡 Total Partners permissions now: 54', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
