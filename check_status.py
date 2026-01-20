from django.contrib.auth.models import Group, Permission
from users.models import GroupExtension, PermissionExtension

print('\n📊 Current Database Status:\n')
print(f'Groups: {Group.objects.count()}')
print(f'Group Extensions: {GroupExtension.objects.count()}')
print(f'Permissions: {Permission.objects.count()}')
print(f'Permission Extensions: {PermissionExtension.objects.count()}')
