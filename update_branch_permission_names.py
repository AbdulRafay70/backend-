"""
Script to update branch permission names to clarify they are for branch users.
Update: add_branch_admin, edit_branch_admin, delete_branch_admin
To: add_branch_users_admin, edit_branch_users_admin, delete_branch_users_admin
Run with: python update_branch_permission_names.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🔧 Updating branch permission names to clarify branch users...\n', flush=True)

    try:
        updates = [
            {'old': 'add_branch_admin', 'new': 'add_branch_users_admin', 'name': 'Can add branch users in admin portal'},
            {'old': 'edit_branch_admin', 'new': 'edit_branch_users_admin', 'name': 'Can edit branch users in admin portal'},
            {'old': 'delete_branch_admin', 'new': 'delete_branch_users_admin', 'name': 'Can delete branch users in admin portal'}
        ]

        updated_count = 0
        for update in updates:
            try:
                perm = Permission.objects.get(codename=update['old'])
                perm.codename = update['new']
                perm.name = update['name']
                perm.save()
                print(f'✅ Updated: {update["old"]} → {update["new"]}', flush=True)
                print(f'   New name: {update["name"]}', flush=True)
                updated_count += 1
            except Permission.DoesNotExist:
                print(f'⚠️  Not found: {update["old"]}', flush=True)

        print(f'\n📊 Summary:', flush=True)
        print(f'  • Permissions updated: {updated_count}', flush=True)

        print(f'\n✅ Successfully updated branch permission names!', flush=True)
        print(f'\n💡 Branch section now clearly indicates branch users management.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
