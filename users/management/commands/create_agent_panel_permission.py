from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Create can_access_agent_panel permission for UserProfile'

    def handle(self, *args, **options):
        # Get the content type for UserProfile
        content_type = ContentType.objects.get_for_model(UserProfile)
        
        # Create or get the permission
        permission, created = Permission.objects.get_or_create(
            codename='can_access_agent_panel',
            content_type=content_type,
            defaults={
                'name': 'Can access agent panel',
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(
                f'✓ Successfully created permission: {permission.name} (codename: {permission.codename})'
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f'⚠ Permission already exists: {permission.name} (codename: {permission.codename})'
            ))
