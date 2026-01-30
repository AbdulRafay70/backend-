from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from organization.models import Organization, Branch
from ledger.models import Account, LedgerEntry, LedgerLine
from django.db import transaction
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seeds initial financial data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding Financial Data...")

        # 1. Get Context
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            user = User.objects.first()
        
        org = Organization.objects.first()
        branch = Branch.objects.first()

        if not org or not branch or not user:
            self.stdout.write(self.style.ERROR("Error: Need at least one Organization, Branch, and User."))
            return

        self.stdout.write(f"Using Org: {org.name}, Branch: {branch.name}, User: {user.username}")

        # 2. Create Accounts
        accounts_data = [
            {'name': 'Main Office Cash', 'type': 'CASH'},
            {'name': 'Meezan Bank Corporate', 'type': 'BANK', 'bank_name': 'Meezan Bank', 'account_number': '0101-1001', 'iban': 'PK36MEZN0001'},
            {'name': 'Office Rent Expense', 'type': 'EXPENSE'},
            {'name': 'Utilities Expense', 'type': 'EXPENSE'},
            {'name': 'Service Revenue', 'type': 'INCOME'},
            {'name': 'Owner Capital', 'type': 'EQUITY'},
        ]

        created_counts = 0
        acc_map = {}

        for acc_data in accounts_data:
            acc, created = Account.objects.get_or_create(
                name=acc_data['name'],
                organization=org,
                defaults={
                    'account_type': acc_data['type'],
                    'branch': branch,
                    'bank_name': acc_data.get('bank_name'),
                    'account_number': acc_data.get('account_number'),
                    'iban': acc_data.get('iban'),
                }
            )
            acc_map[acc_data['name']] = acc
            if created:
                created_counts += 1
                self.stdout.write(f"Created Account: {acc.name}")
            else:
                self.stdout.write(f"Account Exists: {acc.name}")

        # 3. Create Opening Balances (if not exist)
        # Check if we have entries
        if not LedgerEntry.objects.filter(service_type='opening_balance', organization=org).exists():
            with transaction.atomic():
                # Capital In (Opening)
                entry = LedgerEntry.objects.create(
                    organization=org,
                    branch=branch,
                    transaction_type='credit',
                    service_type='opening_balance',
                    narration="Initial Capital Investment",
                    transaction_amount=Decimal('1000000'),
                    created_by=user,
                    is_manual=True,
                    locked=True
                )
                
                # Debit Bank
                LedgerLine.objects.create(ledger_entry=entry, account=acc_map['Meezan Bank Corporate'], debit=Decimal('1000000'), credit=0, remarks="Opening Bank Balance")
                # Credit Capital
                LedgerLine.objects.create(ledger_entry=entry, account=acc_map['Owner Capital'], debit=0, credit=Decimal('1000000'), remarks="Owner Investment")
                
                self.stdout.write(self.style.SUCCESS("Created Opening Balance Entry"))

        # 4. Create Sample Transactions
        # Rent Payment
        if not LedgerEntry.objects.filter(service_type='expense', narration="Monthly Rent Payment").exists():
             with transaction.atomic():
                entry = LedgerEntry.objects.create(
                    organization=org,
                    branch=branch,
                    transaction_type='debit',
                    service_type='expense',
                    narration="Monthly Rent Payment",
                    transaction_amount=Decimal('50000'),
                    created_by=user,
                    is_manual=True
                )
                # Debit Expense
                LedgerLine.objects.create(ledger_entry=entry, account=acc_map['Office Rent Expense'], debit=Decimal('50000'), credit=0)
                # Credit Bank
                LedgerLine.objects.create(ledger_entry=entry, account=acc_map['Meezan Bank Corporate'], debit=0, credit=Decimal('50000'))
                
                self.stdout.write(self.style.SUCCESS("Created Rent Payment Transaction"))

        self.stdout.write(self.style.SUCCESS(f"Done! Created {created_counts} new accounts."))
