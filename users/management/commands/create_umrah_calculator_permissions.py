"""
Management command to create Umrah Calculator permissions for Agent portal
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension


class Command(BaseCommand):
    help = 'Create Umrah Calculator permissions for Agent portal'

    def handle(self, *args, **kwargs):
        # Create or get content type for umrah calculator
        content_type, _ = ContentType.objects.get_or_create(
            app_label='agent',
            model='umrah_calculator_agent'
        )

        permissions_data = [
            # Transport
            ('add_transport_agent', 'Can add transport in agent umrah calculator'),
            ('edit_transport_agent', 'Can edit transport in agent umrah calculator'),
            ('delete_transport_agent', 'Can delete transport in agent umrah calculator'),
            
            # Flight
            ('add_flight_agent', 'Can add flight in agent umrah calculator'),
            ('edit_flight_agent', 'Can edit flight in agent umrah calculator'),
            ('delete_flight_agent', 'Can delete flight in agent umrah calculator'),
            
            # Hotel
            ('add_hotel_agent', 'Can add hotel in agent umrah calculator'),
            ('edit_hotel_agent', 'Can edit hotel in agent umrah calculator'),
            ('delete_hotel_agent', 'Can delete hotel in agent umrah calculator'),
            
            # Food
            ('add_food_agent', 'Can add food in agent umrah calculator'),
            ('edit_food_agent', 'Can edit food in agent umrah calculator'),
            ('delete_food_agent', 'Can delete food in agent umrah calculator'),
            
            # Ziarat
            ('add_ziarat_agent', 'Can add ziarat in agent umrah calculator'),
            ('edit_ziarat_agent', 'Can edit ziarat in agent umrah calculator'),
            ('delete_ziarat_agent', 'Can delete ziarat in agent umrah calculator'),
        ]

        created_count = 0
        updated_count = 0

        for codename, name in permissions_data:
            permission, created = Permission.objects.get_or_create(
                codename=codename,
                content_type=content_type,
                defaults={'name': name}
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created permission: {codename}')
                )
            else:
                # Update name if it changed
                if permission.name != name:
                    permission.name = name
                    permission.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'↻ Updated permission: {codename}')
                    )
                else:
                    self.stdout.write(f'  Permission already exists: {codename}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Summary: {created_count} created, {updated_count} updated, '
                f'{len(permissions_data) - created_count - updated_count} unchanged'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'📊 Total Umrah Calculator permissions: {len(permissions_data)}'
            )
        )
