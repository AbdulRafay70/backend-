"""
Script to clean up Partners permissions:
1. Delete all view_*_users_admin permissions except view_add_users_admin
2. Check for duplicate add_branch_admin
Run with: python cleanup_partners_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🔧 Cleaning up Partners permissions...\n', flush=True)

    try:
        # Step 1: Delete specific user type view permissions
        print('Step 1: Deleting specific user type view permissions...', flush=True)
        view_permissions_to_delete = [
            'view_super_admin_users_admin',
            'view_admin_users_admin',
            'view_agent_users_admin',
            'view_area_agent_users_admin',
            'view_employee_users_admin',
            'view_branch_users_admin'
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

        print(f'\n  📊 Deleted {deleted_count} user type view permissions', flush=True)

        # Step 2: Check for duplicate add_branch_admin
        print('\nStep 2: Checking for duplicate add_branch_admin...', flush=True)
        branch_perms = Permission.objects.filter(codename='add_branch_admin')
        
        if branch_perms.count() > 1:
            print(f'  ⚠️  Found {branch_perms.count()} add_branch_admin permissions:', flush=True)
            for perm in branch_perms:
                print(f'    ID: {perm.id}, Name: {perm.name}, Content Type: {perm.content_type}', flush=True)
            
            # Keep the one from Partners (User content type), delete others
            print('\n  Keeping the Partners version, deleting duplicates...', flush=True)
            kept_perm = None
            for perm in branch_perms:
                if perm.content_type.model == 'user':
                    kept_perm = perm
                    print(f'  ✅ Keeping: ID {perm.id} (User content type)', flush=True)
                else:
                    perm.delete()
                    print(f'  ❌ Deleted: ID {perm.id} ({perm.content_type})', flush=True)
        else:
            print(f'  ✅ No duplicates found (only {branch_perms.count()} permission)', flush=True)

        print('\n✅ Successfully cleaned up Partners permissions!', flush=True)
        
        print(f'\n💡 Partners structure now:', flush=True)
        print(f'  👥 Add Users: view_add_users_admin (1 permission)', flush=True)
        print(f'  👑 User types: add, edit, delete only (3 permissions each)', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
