from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from users.models import PermissionExtension


class Command(BaseCommand):
    help = 'Check and update ledger permissions grouping'

    def handle(self, *args, **options):
        # Check both ledger permissions
        ledger_perms = Permission.objects.filter(
            codename__in=['view_ledger_admin', 'view_financial_ledger_admin']
        )
        
        self.stdout.write('\n' + '='*80)
        self.stdout.write('Current Ledger Permissions Status:')
        self.stdout.write('='*80 + '\n')
        
        for perm in ledger_perms:
            try:
                ext = PermissionExtension.objects.get(permission=perm)
                self.stdout.write(f'{perm.codename}:')
                self.stdout.write(f'  Type: {ext.type}')
                self.stdout.write(f'  Name: {perm.name}')
            except PermissionExtension.DoesNotExist:
                self.stdout.write(f'{perm.codename}:')
                self.stdout.write(f'  Type: NO EXTENSION')
                self.stdout.write(f'  Name: {perm.name}')
        
        self.stdout.write('\n' + '='*80)
        self.stdout.write('Updating permissions...')
        self.stdout.write('='*80 + '\n')
        
        # Update view_financial_ledger_admin to Finance
        try:
            financial_ledger = Permission.objects.get(codename='view_financial_ledger_admin')
            ext, created = PermissionExtension.objects.get_or_create(permission=financial_ledger)
            ext.type = 'Finance'
            ext.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Set view_financial_ledger_admin to Finance'))
        except Permission.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ view_financial_ledger_admin not found'))
        
        # Update view_ledger_admin to Payments
        try:
            ledger = Permission.objects.get(codename='view_ledger_admin')
            ext, created = PermissionExtension.objects.get_or_create(permission=ledger)
            ext.type = 'Payments'
            ext.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Set view_ledger_admin to Payments'))
        except Permission.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ view_ledger_admin not found'))
        
        self.stdout.write('\n' + '='*80)
        self.stdout.write('Final Status:')
        self.stdout.write('='*80 + '\n')
        
        for perm in ledger_perms:
            try:
                ext = PermissionExtension.objects.get(permission=perm)
                self.stdout.write(f'{perm.codename}: {ext.type}')
            except PermissionExtension.DoesNotExist:
                self.stdout.write(f'{perm.codename}: NO EXTENSION')
