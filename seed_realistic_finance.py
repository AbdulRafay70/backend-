import os
import django
import sys
from decimal import Decimal
from datetime import date

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import Account, LedgerEntry, LedgerLine
from organization.models import Organization

def get_or_create_account(name, code, type, subtype, org):
    # Ignoring code and subtype as they don't exist in current Account model
    acc, created = Account.objects.get_or_create(
        name=name,
        account_type=type,
        defaults={
            'balance': Decimal('0.00'),
            'organization': org
        }
    )
    if created:
        print(f"Created Account: {name}")
    else:
        print(f"Account exists: {name}")
    return acc

def post_entry(description, date_val, debits, credits, org, type_label="other"):
    """
    debits/credits: list of (account, amount)
    """
    total_debit = sum(x[1] for x in debits)
    total_credit = sum(x[1] for x in credits)
    
    if total_debit != total_credit:
        print(f"ERROR: Unbalanced entry {description} (Dr {total_debit} != Cr {total_credit})")
        return

    # Create Header (LedgerEntry)
    entry = LedgerEntry.objects.create(
        narration=description,
        transaction_amount=total_debit,
        service_type=type_label,
        transaction_type='other',
        created_at=date_val,
        organization=org
    )
    
    # Lines
    for acc, amount in debits:
        LedgerLine.objects.create(
            ledger_entry=entry, 
            account=acc, 
            debit=amount, 
            credit=0,
            balance_after=acc.balance + amount
        )
        acc.balance += amount
        acc.save()
        
    for acc, amount in credits:
        LedgerLine.objects.create(
            ledger_entry=entry, 
            account=acc, 
            debit=0, 
            credit=amount,
            balance_after=acc.balance - amount
        )
        acc.balance -= amount
        acc.save()
        
    print(f"Posted: {description} | Amount: {total_debit}")

def seed_data():
    with open("seed_log.txt", "w") as f:
        f.write("--- Starting Realistic Seeding ---\n")
        
        try:
            # 0. Get Organization
            org = Organization.objects.first()
            if not org:
                f.write("No Organization found. Creating 'Test Org'.\n")
                org = Organization.objects.create(name="Test Org", code="TO1")
            
            f.write(f"Using Organization: {org.name} (ID: {org.id})\n")

            # 1. Accounts
            cash = get_or_create_account("Cash on Hand", "1001", "CASH", "Asset", org)
            bank = get_or_create_account("Bank Account", "1002", "BANK", "Asset", org)
            
            ar = get_or_create_account("Accounts Receivable", "1200", "RECEIVABLE", "Asset", org)
            ap = get_or_create_account("Accounts Payable", "2000", "PAYABLE", "Liability", org)
            
            equity = get_or_create_account("Owner's Equity", "3000", "EQUITY", "Equity", org)
            
            income_service = get_or_create_account("Service Income", "4000", "INCOME", "Income", org)
            income_ticket = get_or_create_account("Ticket Sales", "4100", "INCOME", "Income", org)
            
            expense_general = get_or_create_account("General Expenses", "5000", "EXPENSE", "Expense", org)
            expense_cogs_ticket = get_or_create_account("Cost of Sales - Tickets", "5100", "EXPENSE", "Expense", org)

            # 2. Transactions
            today = date.today()
            
            # A. Initial Capital Injection
            try:
                post_entry(
                    "Initial Capital Injection", 
                    today, 
                    debits=[(cash, Decimal('500000')), (bank, Decimal('1000000'))],
                    credits=[(equity, Decimal('1500000'))],
                    org=org,
                    type_label="payment"
                )
                f.write("Posted: Initial Capital Injection\n")
            except Exception as e:
                f.write(f"ERROR posting Initial Capital: {e}\n")

            # B. Cash Service Sale
            try:
                post_entry(
                    "Cash Service Sale", 
                    today, 
                    debits=[(cash, Decimal('50000'))],
                    credits=[(income_service, Decimal('50000'))],
                    org=org,
                    type_label="other"
                )
                f.write("Posted: Cash Service Sale\n")
            except Exception as e:
                f.write(f"ERROR posting Cash Sale: {e}\n")
            
            # C. Ticket Sale (Invoice) - Selling to Customer
            # 2x LHE-DXB Tickets @ 75k each = 150k
            try:
                post_entry(
                    "Ticket Sale: 2x LHE-DXB (Invoice #INV-2024-001)", 
                    today, 
                    debits=[(ar, Decimal('150000'))],
                    credits=[(income_ticket, Decimal('150000'))],
                    org=org,
                    type_label="ticket"
                )
                f.write("Posted: Ticket Sale (Revenue)\n")
            except Exception as e:
                f.write(f"ERROR posting Ticket Sale: {e}\n")

            # D. Ticket Purchase (Bill) - Buying from Supplier
            # 2x LHE-DXB Tickets @ 70k each = 140k
            try:
                post_entry(
                    "Ticket Purchase: 2x LHE-DXB (Bill #BILL-999)", 
                    today, 
                    debits=[(expense_cogs_ticket, Decimal('140000'))],
                    credits=[(ap, Decimal('140000'))],
                    org=org,
                    type_label="ticket"
                )
                f.write("Posted: Ticket Purchase (COGS)\n")
            except Exception as e:
                f.write(f"ERROR posting Ticket Purchase: {e}\n")

            # E. Expense Payment (Rent)
            try:
                post_entry(
                    "Office Rent Payment", 
                    today, 
                    debits=[(expense_general, Decimal('20000'))],
                    credits=[(cash, Decimal('20000'))],
                    org=org,
                    type_label="other"
                )
                f.write("Posted: Rent Payment\n")
            except Exception as e:
                f.write(f"ERROR posting Rent Payment: {e}\n")
            
            # F. Vendor Bill (General)
            try:
                post_entry(
                    "Utility Bill Received", 
                    today, 
                    debits=[(expense_general, Decimal('30000'))],
                    credits=[(ap, Decimal('30000'))],
                    org=org,
                    type_label="other"
                )
                f.write("Posted: Utility Bill\n")
            except Exception as e:
                f.write(f"ERROR posting Utility Bill: {e}\n")
            
            # G. Customer Payment
            try:
                post_entry(
                    "Payment Received for Ticket Invoice #INV-2024-001", 
                    today, 
                    debits=[(bank, Decimal('150000'))],
                    credits=[(ar, Decimal('150000'))],
                    org=org,
                    type_label="payment"
                )
                f.write("Posted: Customer Payment (Ticket)\n")
            except Exception as e:
                f.write(f"ERROR posting Customer Payment: {e}\n")

            f.write("--- Seeding Complete ---\n")
            
        except Exception as e:
            f.write(f"FATAL ERROR: {e}\n")

if __name__ == '__main__':
    seed_data()
