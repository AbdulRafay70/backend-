"""
Script to create organization-scoped view permissions for Add Users section.
Creates: view_groups_admin, view_branches_admin, view_organization_admin
Run with: python create_organization_view_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from organization.models import Branch, Organization

def main():
    print('\n🔧 Creating organization-scoped view permissions for Add Users...\n', flush=True)

    try:
        # Get content types
        group_content_type = ContentType.objects.get_for_model(Group)
        branch_content_type = ContentType.objects.get_for_model(Branch)
        org_content_type = ContentType.objects.get_for_model(Organization)

        created_permissions = []

        # 1. Create view_groups_admin permission
        print('Creating view_groups_admin permission...', flush=True)
        groups_perm, created = Permission.objects.get_or_create(
            codename='view_groups_admin',
            content_type=group_content_type,
            defaults={'name': 'Can view groups in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {groups_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {groups_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=groups_perm,
            defaults={'type': 'view'}
        )
        created_permissions.append({'id': groups_perm.id, 'codename': groups_perm.codename, 'name': groups_perm.name})

        # 2. Create view_branches_admin permission
        print('\nCreating view_branches_admin permission...', flush=True)
        branches_perm, created = Permission.objects.get_or_create(
            codename='view_branches_admin',
            content_type=branch_content_type,
            defaults={'name': 'Can view branches in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {branches_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {branches_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=branches_perm,
            defaults={'type': 'view'}
        )
        created_permissions.append({'id': branches_perm.id, 'codename': branches_perm.codename, 'name': branches_perm.name})

        # 3. Create view_organization_admin permission
        print('\nCreating view_organization_admin permission...', flush=True)
        org_perm, created = Permission.objects.get_or_create(
            codename='view_organization_admin',
            content_type=org_content_type,
            defaults={'name': 'Can view organization in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {org_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {org_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=org_perm,
            defaults={'type': 'view'}
        )
        created_permissions.append({'id': org_perm.id, 'codename': org_perm.codename, 'name': org_perm.name})

        print('\n✅ Successfully created organization-scoped view permissions!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        for perm in created_permissions:
            print(f'  • {perm["codename"]} - {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Add Users section now has 5 permissions:', flush=True)
        print(f'  • view_add_users_admin (view add users page)', flush=True)
        print(f'  • view_users_admin (view users list)', flush=True)
        print(f'  • view_groups_admin (view groups) ← NEW', flush=True)
        print(f'  • view_branches_admin (view branches) ← NEW', flush=True)
        print(f'  • view_organization_admin (view organization) ← NEW', flush=True)

        print(f'\n📝 Note: These permissions are organization-scoped.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
