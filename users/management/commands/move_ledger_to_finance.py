from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from users.models import PermissionExtension


class Command(BaseCommand):
    help = 'Move view_financial_ledger_admin permission from Payments to Finance section'

    def handle(self, *args, **options):
        # Find the permission
        try:
            permission = Permission.objects.get(codename='view_financial_ledger_admin')
            self.stdout.write(f'Found permission: {permission.codename}')
            
            # Get or create the PermissionExtension
            perm_ext, created = PermissionExtension.objects.get_or_create(
                permission=permission
            )
            
            old_type = perm_ext.type
            
            # Update the type to Finance
            perm_ext.type = 'Finance'
            perm_ext.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Successfully moved view_financial_ledger_admin from "{old_type}" to "Finance"'
                )
            )
            
            # Verify the change
            perm_ext.refresh_from_db()
            self.stdout.write(f'Current type: {perm_ext.type}')
            
        except Permission.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('❌ Permission view_financial_ledger_admin not found')
            )
