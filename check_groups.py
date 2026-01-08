"""
Check all groups in the database
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Group

print("=" * 60)
print("GROUPS IN DATABASE")
print("=" * 60)
print()

# Check all groups
groups = Group.objects.all()
print(f"📊 Total Groups: {groups.count()}")
print()

if groups.count() > 0:
    for group in groups:
        print(f"Group ID: {group.id}")
        print(f"  • Name: {group.name}")
        print(f"  • Permissions: {group.permissions.count()}")
        if group.permissions.count() > 0:
            for perm in group.permissions.all()[:5]:  # Show first 5 permissions
                print(f"    - {perm.codename}")
            if group.permissions.count() > 5:
                print(f"    ... and {group.permissions.count() - 5} more")
        print()
else:
    print("❌ No groups found in database!")
    print()

print("=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
