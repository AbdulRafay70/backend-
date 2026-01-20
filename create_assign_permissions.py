"""
Script to replace view permissions with assign permissions for Add Users section.
Delete: view_organization_admin, view_branches_admin, view_groups_admin
Create: assign_organization_admin, assign_branches_admin, assign_groups_admin, assign_agency_admin
Run with: python create_assign_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from organization.models import Branch, Organization, Agency

def main():
    print('\n🔧 Replacing view permissions with assign permissions...\n', flush=True)

    try:
        # Step 1: Delete old view permissions
        print('Step 1: Deleting old view permissions...', flush=True)
        view_permissions_to_delete = [
            'view_organization_admin',
            'view_branches_admin',
            'view_groups_admin'
        ]

        deleted_count = 0
        for codename in view_permissions_to_delete:
            try:
                perm = Permission.objects.get(codename=codename)
                perm.delete()
                print(f'  ❌ Deleted: {codename}', flush=True)
                deleted_count += 1
            except Permission.DoesNotExist:
                print(f'  ⚠️  Not found: {codename}', flush=True)

        print(f'\n  📊 Deleted {deleted_count} view permissions', flush=True)

        # Step 2: Create assign permissions
        print('\nStep 2: Creating assign permissions...', flush=True)
        
        # Get content types
        org_content_type = ContentType.objects.get_for_model(Organization)
        branch_content_type = ContentType.objects.get_for_model(Branch)
        group_content_type = ContentType.objects.get_for_model(Group)
        agency_content_type = ContentType.objects.get_for_model(Agency)

        assign_perms = [
            {'codename': 'assign_organization_admin', 'name': 'Can assign organization in admin portal', 'content_type': org_content_type},
            {'codename': 'assign_branches_admin', 'name': 'Can assign branches in admin portal', 'content_type': branch_content_type},
            {'codename': 'assign_groups_admin', 'name': 'Can assign groups in admin portal', 'content_type': group_content_type},
            {'codename': 'assign_agency_admin', 'name': 'Can assign agency in admin portal', 'content_type': agency_content_type}
        ]

        created_permissions = []
        for perm_data in assign_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=perm_data['content_type'],
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': 'assign'}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name
            })

        print('\n✅ Successfully created assign permissions!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        for perm in created_permissions:
            print(f'  • {perm["codename"]} - {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Add Users section now has 6 permissions:', flush=True)
        print(f'  • view_add_users_admin (view add users page)', flush=True)
        print(f'  • view_users_admin (view users list)', flush=True)
        print(f'  • assign_organization_admin (assign organization)', flush=True)
        print(f'  • assign_branches_admin (assign branches)', flush=True)
        print(f'  • assign_groups_admin (assign groups)', flush=True)
        print(f'  • assign_agency_admin (assign agency)', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
