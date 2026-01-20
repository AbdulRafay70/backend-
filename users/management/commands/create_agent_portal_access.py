from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension


class Command(BaseCommand):
    help = 'Create agent_portal_access permission for agent login'

    def handle(self, *args, **options):
        try:
            # Get the User content type
            from django.contrib.auth import get_user_model
            User = get_user_model()
            content_type = ContentType.objects.get_for_model(User)
            
            # Create the agent_portal_access permission
            permission, created = Permission.objects.get_or_create(
                codename='agent_portal_access',
                content_type=content_type,
                defaults={
                    'name': 'Can access agent portal'
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'✅ Created agent_portal_access permission'
                ))
                
                # Create PermissionExtension for categorization
                perm_ext, ext_created = PermissionExtension.objects.get_or_create(
                    permission=permission,
                    defaults={'type': 'Login'}
                )
                
                if ext_created:
                    self.stdout.write(self.style.SUCCESS(
                        f'✅ Created PermissionExtension for agent_portal_access (type: Login)'
                    ))
                else:
                    self.stdout.write(self.style.WARNING(
                        f'⚠️  PermissionExtension already exists for agent_portal_access'
                    ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'⚠️  agent_portal_access permission already exists'
                ))
            
            # Verify the permission
            self.stdout.write('\n' + '='*80)
            self.stdout.write('Permission Details:')
            self.stdout.write('='*80)
            self.stdout.write(f'Codename: {permission.codename}')
            self.stdout.write(f'Name: {permission.name}')
            self.stdout.write(f'Content Type: {permission.content_type}')
            
            try:
                ext = PermissionExtension.objects.get(permission=permission)
                self.stdout.write(f'Category Type: {ext.type}')
            except PermissionExtension.DoesNotExist:
                self.stdout.write('Category Type: None')
            
            self.stdout.write('='*80 + '\n')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {str(e)}'))
