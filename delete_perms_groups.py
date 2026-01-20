"""
Script to delete all permissions and groups from the database.
Run with: python delete_perms_groups.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from users.models import GroupExtension, PermissionExtension

def main():
    # Count existing records
    group_count = Group.objects.count()
    permission_count = Permission.objects.count()
    group_ext_count = GroupExtension.objects.count()
    perm_ext_count = PermissionExtension.objects.count()

    print('\n⚠️  WARNING: This will delete ALL permissions and groups from the database!\n')
    print(f'  • Groups: {group_count}')
    print(f'  • Group Extensions: {group_ext_count}')
    print(f'  • Permissions: {permission_count}')
    print(f'  • Permission Extensions: {perm_ext_count}\n')

    confirm = input('Are you sure you want to proceed? Type "yes" to continue: ')
    if confirm.lower() != 'yes':
        print('❌ Operation cancelled.')
        return

    try:
        # Delete GroupExtensions first (foreign key to Group)
        print('Deleting GroupExtensions...')
        deleted_group_ext = GroupExtension.objects.all().delete()
        print(f'✅ Deleted {deleted_group_ext[0]} GroupExtension records')

        # Delete Groups (this will also remove user-group relationships)
        print('Deleting Groups...')
        deleted_groups = Group.objects.all().delete()
        print(f'✅ Deleted {deleted_groups[0]} Group records')

        # Delete PermissionExtensions first (foreign key to Permission)
        print('Deleting PermissionExtensions...')
        deleted_perm_ext = PermissionExtension.objects.all().delete()
        print(f'✅ Deleted {deleted_perm_ext[0]} PermissionExtension records')

        # Delete Permissions
        print('Deleting Permissions...')
        deleted_perms = Permission.objects.all().delete()
        print(f'✅ Deleted {deleted_perms[0]} Permission records')

        print('\n✅ Successfully deleted all permissions and groups from the database!')

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}')
        raise

if __name__ == '__main__':
    main()
