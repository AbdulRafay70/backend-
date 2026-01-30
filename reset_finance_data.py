import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import Account, LedgerEntry, LedgerLine
from finance.models import Expense, FinancialRecord, TransactionJournal

def reset_data():
    with open("reset_log.txt", "w") as f:
        f.write("--- Starting Data Reset ---\n")
        
        try:
            # 1. DELETE Ledger Data (Lines first, then Entries)
            f.write("Deleting Ledger Lines...\n")
            count_ll, _ = LedgerLine.objects.all().delete()
            f.write(f"Deleted {count_ll} Ledger Lines.\n")
        except Exception as e:
            f.write(f"ERROR deleting Ledger Lines: {e}\n")

        try:
            f.write("Deleting Ledger Entries...\n")
            count_le, _ = LedgerEntry.objects.all().delete()
            f.write(f"Deleted {count_le} Ledger Entries.\n")
        except Exception as e:
            f.write(f"ERROR deleting Ledger Entries: {e}\n")

        try:
            # 2. DELETE Expenses
            f.write("Deleting Expenses...\n")
            count_exp, _ = Expense.objects.all().delete()
            f.write(f"Deleted {count_exp} Expenses.\n")
        except Exception as e:
            f.write(f"ERROR deleting Expenses: {e}\n")

        try:
            # 3. DELETE Financial Records
            f.write("Deleting Financial Records...\n")
            count_fr, _ = FinancialRecord.objects.all().delete()
            f.write(f"Deleted {count_fr} Financial Records.\n")
        except Exception as e:
            f.write(f"ERROR deleting Financial Records: {e}\n")

        try:
            # 4. DELETE TransactionJournals
            f.write("Deleting Transaction Journals...\n")
            count_tj, _ = TransactionJournal.objects.all().delete()
            f.write(f"Deleted {count_tj} Transaction Journals.\n")
        except Exception as e:
            f.write(f"ERROR deleting Transaction Journals: {e}\n")

        try:
            # 5. RESET Account Balances
            f.write("Resetting Account Balances to 0.00...\n")
            Account.objects.update(balance=0.00)
            f.write("All Account balances reset.\n")
        except Exception as e:
            f.write(f"ERROR resetting Account Balances: {e}\n")

        f.write("--- Data Reset Complete (Check for Errors) ---\n")

if __name__ == '__main__':
    reset_data()
