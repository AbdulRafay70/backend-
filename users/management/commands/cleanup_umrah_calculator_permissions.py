"""
Management command to delete edit and delete permissions from Umrah Calculator
Keep only add permissions
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Delete edit and delete permissions from Umrah Calculator, keep only add permissions'

    def handle(self, *args, **kwargs):
        # Get content type for umrah calculator
        try:
            content_type = ContentType.objects.get(
                app_label='agent',
                model='umrah_calculator_agent'
            )
        except ContentType.DoesNotExist:
            self.stdout.write(self.style.ERROR('Content type not found'))
            return

        # Permissions to delete
        permissions_to_delete = [
            'edit_transport_agent',
            'delete_transport_agent',
            'edit_flight_agent',
            'delete_flight_agent',
            'edit_hotel_agent',
            'delete_hotel_agent',
            'edit_food_agent',
            'delete_food_agent',
            'edit_ziarat_agent',
            'delete_ziarat_agent',
        ]

        deleted_count = 0

        for codename in permissions_to_delete:
            try:
                permission = Permission.objects.get(
                    codename=codename,
                    content_type=content_type
                )
                permission.delete()
                deleted_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Deleted permission: {codename}')
                )
            except Permission.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'  Permission not found: {codename}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Deleted {deleted_count} permissions'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'📊 Remaining Umrah Calculator permissions: 5 (add only)'
            )
        )
