"""
Django management command to delete duplicate hotel permissions with 'pax_hotels_admin' codename.
These are duplicates of the main hotel permissions.

Run this command with: python manage.py delete_pax_hotel_permissions
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission


class Command(BaseCommand):
    help = 'Delete duplicate hotel permissions with pax_hotels_admin codename'

    def handle(self, *args, **options):
        # Find permissions with 'pax_hotels_admin' in the codename
        duplicate_permissions = Permission.objects.filter(codename__icontains='pax_hotels_admin')

        self.stdout.write(f"\nFound {duplicate_permissions.count()} duplicate permissions to delete:")
        for perm in duplicate_permissions:
            self.stdout.write(f"  - {perm.content_type.app_label}.{perm.codename}: {perm.name}")

        if duplicate_permissions.exists():
            confirm = input("\nDo you want to delete these permissions? (yes/no): ")
            if confirm.lower() == 'yes':
                count = duplicate_permissions.count()
                duplicate_permissions.delete()
                self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully deleted {count} duplicate permissions!"))
                
                self.stdout.write("\nRemaining hotel permissions:")
                hotel_permissions = Permission.objects.filter(codename__icontains='hotel_admin')
                for perm in hotel_permissions:
                    self.stdout.write(f"  - {perm.content_type.app_label}.{perm.codename}: {perm.name}")
            else:
                self.stdout.write(self.style.WARNING("\n❌ Deletion cancelled."))
        else:
            self.stdout.write(self.style.SUCCESS("\n✅ No duplicate permissions found!"))
