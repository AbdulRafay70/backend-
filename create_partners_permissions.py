"""
Script to create Partners/Add Users permissions (admin only).
Structure:
- Add Users (view only - 1 permission)
  - Super Admin (CRUD - 4 permissions)
  - Admin (CRUD - 4 permissions)
  - Agent (CRUD - 4 permissions)
  - Area Agent (CRUD - 4 permissions)
  - Employee (CRUD - 4 permissions)
  - Branch (CRUD - 4 permissions)
Total: 25 permissions
Run with: python create_partners_permissions.py
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
    print('\n🔧 Creating Partners/Add Users permissions...\n', flush=True)

    try:
        # Use User model as content type
        user_content_type = ContentType.objects.get_for_model(User)

        # Step 1: Create view permission for Add Users
        print('Step 1: Creating Add Users view permission...', flush=True)
        add_users_perm, created = Permission.objects.get_or_create(
            codename='view_add_users_admin',
            content_type=user_content_type,
            defaults={'name': 'Can view add users in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {add_users_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {add_users_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=add_users_perm,
            defaults={'type': 'view'}
        )

        # Step 2: Create CRUD permissions for each user type
        print('\nStep 2: Creating CRUD permissions for user types...', flush=True)
        
        user_types = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'agent': 'Agent',
            'area_agent': 'Area Agent',
            'employee': 'Employee',
            'branch': 'Branch'
        }

        created_permissions = {key: [] for key in user_types.keys()}
        total_count = 1  # Start with 1 for the view_add_users_admin

        for user_key, user_label in user_types.items():
            print(f'\n  📋 Creating permissions for {user_label}...', flush=True)
            
            crud_permissions = ['view', 'add', 'edit', 'delete']
            
            for perm_type in crud_permissions:
                codename = f'{perm_type}_{user_key}_admin'
                name = f'Can {perm_type} {user_label.lower()} in admin portal'
                
                permission, created = Permission.objects.get_or_create(
                    codename=codename,
                    content_type=user_content_type,
                    defaults={'name': name}
                )
                
                if created:
                    print(f'    ✅ Created: {permission.codename}', flush=True)
                else:
                    print(f'    ℹ️  Exists: {permission.codename}', flush=True)

                PermissionExtension.objects.get_or_create(
                    permission=permission,
                    defaults={'type': perm_type}
                )

                created_permissions[user_key].append({
                    'id': permission.id,
                    'codename': permission.codename,
                    'name': permission.name,
                    'type': perm_type
                })
                total_count += 1

        print('\n✅ Successfully created all Partners/Add Users permissions!', flush=True)
        
        # Summary
        print(f'\n📊 Add Users Main Permission:', flush=True)
        print(f'  • [VIEW] {add_users_perm.name} (ID: {add_users_perm.id})', flush=True)

        print(f'\n📊 User Type Permissions:', flush=True)
        for user_key, user_label in user_types.items():
            user_perms = created_permissions[user_key]
            print(f'\n  {user_label} - {len(user_perms)} permissions:', flush=True)
            for perm in user_perms:
                print(f'    • [{perm["type"].upper()}] {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n📊 Total Permissions Created: {total_count}', flush=True)
        print(f'\n💡 Note: All permissions are admin-only.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
