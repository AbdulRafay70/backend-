"""
Script to verify permissions and groups have been deleted.
Run with: python verify_deletion.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from users.models import GroupExtension, PermissionExtension

def main():
    # Count remaining records
    group_count = Group.objects.count()
    permission_count = Permission.objects.count()
    group_ext_count = GroupExtension.objects.count()
    perm_ext_count = PermissionExtension.objects.count()

    print('\n📊 Current Database Status:\n')
    print(f'  • Groups: {group_count}')
    print(f'  • Group Extensions: {group_ext_count}')
    print(f'  • Permissions: {permission_count}')
    print(f'  • Permission Extensions: {perm_ext_count}\n')

    if group_count == 0 and permission_count == 0 and group_ext_count == 0 and perm_ext_count == 0:
        print('✅ All permissions and groups have been successfully deleted!')
    else:
        print('⚠️  Some records still remain in the database.')

if __name__ == '__main__':
    main()
