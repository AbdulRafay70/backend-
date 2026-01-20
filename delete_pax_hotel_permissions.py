"""
Script to delete duplicate hotel permissions with 'pax_hotels_admin' codename.
These are duplicates of the main hotel permissions.

Run this script with: python manage.py shell < delete_pax_hotel_permissions.py
"""

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

# Find and delete permissions with 'pax_hotels_admin' in the codename
duplicate_permissions = Permission.objects.filter(codename__icontains='pax_hotels_admin')

print(f"\nFound {duplicate_permissions.count()} duplicate permissions to delete:")
for perm in duplicate_permissions:
    print(f"  - {perm.content_type.app_label}.{perm.codename}: {perm.name}")

if duplicate_permissions.exists():
    confirm = input("\nDo you want to delete these permissions? (yes/no): ")
    if confirm.lower() == 'yes':
        count = duplicate_permissions.count()
        duplicate_permissions.delete()
        print(f"\n✅ Successfully deleted {count} duplicate permissions!")
        print("\nRemaining hotel permissions:")
        hotel_permissions = Permission.objects.filter(codename__icontains='hotel_admin')
        for perm in hotel_permissions:
            print(f"  - {perm.content_type.app_label}.{perm.codename}: {perm.name}")
    else:
        print("\n❌ Deletion cancelled.")
else:
    print("\n✅ No duplicate permissions found!")
