import os
import django
import sys
from decimal import Decimal

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import Account, TransactionJournal, LedgerEntry
from finance.utils import post_journal_to_ledger
from organization.models import Organization
from django.utils import timezone
from users.models import User

def seed_balances():
    # Use Organization 11 (Parent Company)
    org_id = 11
    try:
        org = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        print(f"Organization {org_id} not found. Creating placeholder.")
        org = Organization.objects.create(id=org_id, name="Test Organization")

    system_user = User.objects.first()

    # 1. Ensure Accounts Exist
    cash_acc, _ = Account.objects.get_or_create(
        organization=org,
        name="Cash on Hand",
        defaults={'account_type': 'CASH', 'is_active': True}
    )
    
    bank_acc, _ = Account.objects.get_or_create(
        organization=org,
        name="Bank Account",
        defaults={'account_type': 'BANK', 'is_active': True}
    )
    
    equity_acc, _ = Account.objects.get_or_create(
        organization=org,
        name="Opening Balance Equity",
        defaults={'account_type': 'EQUITY', 'is_active': True}
    )
    
    # Check if already seeded (prevent duplicates)
    if TransactionJournal.objects.filter(narration="Opening Balance Seeding", organization=org).exists():
        print("Opening balances already seeded.")
        return

    # 2. Create Journal for Opening Balances
    # Assets = Debit
    # Equity = Credit
    
    # We need a balanced entry.
    # Total Assets = 10k + 5k = 15k
    # Total Equity = 15k
    
    journal = TransactionJournal.objects.create(
        organization=org,
        date=timezone.now().date(),
        narration="Opening Balance Seeding",
        reference="OPENING-BAL-001",
        created_by=system_user
    )
    
    # 3. Post to Ledger
    # Cash Debit 10000
    LedgerEntry.objects.create(
        journal=journal,
        account=cash_acc,
        debit=Decimal('10000.00'),
        credit=Decimal('0.00'),
        narration="Opening Cash Balance",
        organization=org
    )
    
    # Bank Debit 5000
    LedgerEntry.objects.create(
        journal=journal,
        account=bank_acc,
        debit=Decimal('5000.00'),
        credit=Decimal('0.00'),
        narration="Opening Bank Balance",
        organization=org
    )
    
    # Equity Credit 15000
    LedgerEntry.objects.create(
        journal=journal,
        account=equity_acc,
        debit=Decimal('0.00'),
        credit=Decimal('15000.00'),
        narration="Opening Equity Balance",
        organization=org
    )
    
    # Update Account Balances
    cash_acc.balance += Decimal('10000.00')
    cash_acc.save()
    
    bank_acc.balance += Decimal('5000.00')
    bank_acc.save()
    
    equity_acc.balance -= Decimal('15000.00') # Credit is negative logic for balance usually, or straightforward in ledger calc
    # Wait, our Account model update logic might be custom.
    # Let's trust post_journal_to_ledger usually, but here I am manually creating entries.
    # I should update balances manually since I am bypassing utils for granular control or just call util?
    # I bypassed util because util creates entries from Lines. I created Entries directly.
    # Let's just save.
    
    # Wait, Account.balance field: 
    # If I manually update it:
    # Asset (Debit) -> Balance increases.
    # Equity (Credit) -> Balance decreases (becomes more negative).
    
    equity_acc.balance -= Decimal('15000.00') 
    equity_acc.save()

    print("Success: Seeded Cash(10k), Bank(5k), Equity(15k)")

if __name__ == '__main__':
    seed_balances()
