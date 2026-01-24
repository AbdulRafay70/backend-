from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from organization.models import Organization


class Command(BaseCommand):
    help = 'Remove all permissions and create Employee Access of Agent Portal permission'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting permission cleanup...'))
        
        # Step 1: Delete all existing permissions
        deleted_count = Permission.objects.all().count()
        Permission.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'[OK] Deleted {deleted_count} existing permissions'))
        
        # Step 2: Create the new permission
        # We'll use Organization as the content type since it's a core model
        content_type = ContentType.objects.get_for_model(Organization)
        
        permission, created = Permission.objects.get_or_create(
            codename='employee_agent_portal_access',
            content_type=content_type,
            defaults={
                'name': 'Employee Access of Agent Portal',
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'[OK] Created new permission: "{permission.name}" (codename: {permission.codename})'))
        else:
            self.stdout.write(self.style.WARNING(f'[INFO] Permission already exists: "{permission.name}"'))
        
        self.stdout.write(self.style.SUCCESS('\n[DONE] Permission setup complete!'))
        self.stdout.write(self.style.SUCCESS(f'Permission ID: {permission.id}'))
        self.stdout.write(self.style.SUCCESS(f'Permission Name: {permission.name}'))
        self.stdout.write(self.style.SUCCESS(f'Permission Codename: {permission.codename}'))
        self.stdout.write(self.style.SUCCESS('\nYou can now assign this permission to groups in the Django admin.'))
