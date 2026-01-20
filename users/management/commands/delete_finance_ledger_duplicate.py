from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission


class Command(BaseCommand):
    help = 'Delete the duplicate view_finance_ledger_admin permission'

    def handle(self, *args, **options):
        # Delete the view_finance_ledger_admin permission
        deleted_count, _ = Permission.objects.filter(
            codename='view_finance_ledger_admin'
        ).delete()
        
        if deleted_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Successfully deleted {deleted_count} view_finance_ledger_admin permission(s)'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️  No view_finance_ledger_admin permission found to delete')
            )
        
        # Verify it's gone
        remaining = Permission.objects.filter(codename='view_finance_ledger_admin').count()
        self.stdout.write(f'Remaining view_finance_ledger_admin permissions: {remaining}')
        
        # Check that view_financial_ledger_admin still exists
        financial_ledger = Permission.objects.filter(codename='view_financial_ledger_admin').count()
        self.stdout.write(f'view_financial_ledger_admin permissions: {financial_ledger}')
