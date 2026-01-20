"""
Script to reorganize Partners permissions:
1. Delete view permissions from user type sub-sections
2. Create view permissions for Add Users section
Run with: python reorganize_partners_permissions.py
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
    print('\n🔧 Reorganizing Partners permissions...\n', flush=True)

    try:
        user_content_type = ContentType.objects.get_for_model(User)

        # Step 1: Delete view permissions from user type sections
        print('Step 1: Deleting view permissions from user type sections...', flush=True)
        view_permissions_to_delete = [
            'view_super_admin_admin',
            'view_admin_admin',
            'view_agent_admin',
            'view_area_agent_admin',
            'view_employee_admin',
            'view_branch_admin'
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

        print(f'\n  📊 Deleted {deleted_count} view permissions from user types', flush=True)

        # Step 2: Create view permissions for Add Users section
        print('\nStep 2: Creating view permissions for Add Users section...', flush=True)
        
        user_types = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'agent': 'Agent',
            'area_agent': 'Area Agent',
            'employee': 'Employee',
            'branch': 'Branch'
        }

        created_permissions = []
        for user_key, user_label in user_types.items():
            codename = f'view_{user_key}_users_admin'
            name = f'Can view {user_label.lower()} users in admin portal'
            
            permission, created = Permission.objects.get_or_create(
                codename=codename,
                content_type=user_content_type,
                defaults={'name': name}
            )
            
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': 'view'}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name
            })

        print('\n✅ Successfully reorganized Partners permissions!', flush=True)
        
        print(f'\n📊 Summary:', flush=True)
        print(f'  • View permissions deleted from user types: {deleted_count}', flush=True)
        print(f'  • View permissions created for Add Users: {len(created_permissions)}', flush=True)

        print(f'\n💡 New structure:', flush=True)
        print(f'  👥 Add Users section: view_add_users_admin + 6 user type view permissions', flush=True)
        print(f'  👑 User type sections: add, edit, delete only (no view)', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
