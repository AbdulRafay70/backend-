"""
Script to delete all permissions and groups from the database (auto-confirm).
Run with: python delete_perms_groups_auto.py
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

    print('\n⚠️  Deleting ALL permissions and groups from the database...\n', flush=True)
    print(f'  • Groups: {group_count}', flush=True)
    print(f'  • Group Extensions: {group_ext_count}', flush=True)
    print(f'  • Permissions: {permission_count}', flush=True)
    print(f'  • Permission Extensions: {perm_ext_count}\n', flush=True)

    try:
        # Delete GroupExtensions first (foreign key to Group)
        print('Deleting GroupExtensions...', flush=True)
        deleted_group_ext = GroupExtension.objects.all().delete()
        print(f'✅ Deleted {deleted_group_ext[0]} GroupExtension records', flush=True)

        # Delete Groups (this will also remove user-group relationships)
        print('Deleting Groups...', flush=True)
        deleted_groups = Group.objects.all().delete()
        print(f'✅ Deleted {deleted_groups[0]} Group records', flush=True)

        # Delete PermissionExtensions first (foreign key to Permission)
        print('Deleting PermissionExtensions...', flush=True)
        deleted_perm_ext = PermissionExtension.objects.all().delete()
        print(f'✅ Deleted {deleted_perm_ext[0]} PermissionExtension records', flush=True)

        # Delete Permissions
        print('Deleting Permissions...', flush=True)
        deleted_perms = Permission.objects.all().delete()
        print(f'✅ Deleted {deleted_perms[0]} Permission records', flush=True)

        print('\n✅ Successfully deleted all permissions and groups from the database!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
