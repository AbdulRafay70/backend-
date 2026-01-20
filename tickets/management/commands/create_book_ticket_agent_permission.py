from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from tickets.models import Ticket
from users.models import PermissionExtension


class Command(BaseCommand):
    help = 'Create book_ticket_agent permission for agent portal'

    def handle(self, *args, **options):
        try:
            # Get the ContentType for Ticket model
            content_type = ContentType.objects.get_for_model(Ticket)
            
            # Create the permission
            permission, created = Permission.objects.get_or_create(
                codename='book_ticket_agent',
                content_type=content_type,
                defaults={
                    'name': 'Can book tickets in agent portal',
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created permission: {permission.codename}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠ Permission already exists: {permission.codename}')
                )
            
            # Create or update PermissionExtension to categorize it under "Tickets"
            extension, ext_created = PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={
                    'type': 'Tickets',
                    'description': 'Allows agents to book tickets in the agent portal'
                }
            )
            
            if ext_created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created PermissionExtension with type: {extension.type}')
                )
            else:
                # Update existing extension
                extension.type = 'Tickets'
                extension.description = 'Allows agents to book tickets in the agent portal'
                extension.save()
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Updated PermissionExtension with type: {extension.type}')
                )
            
            self.stdout.write(
                self.style.SUCCESS('\n✓ Successfully created book_ticket_agent permission!')
            )
            self.stdout.write(
                self.style.SUCCESS('✓ Permission will appear under "Tickets" section on permissions page')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error creating permission: {str(e)}')
            )
