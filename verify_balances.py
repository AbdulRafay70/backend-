import os
import django
import sys
from decimal import Decimal

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import Account, LedgerEntry
from django.db.models import Sum

def verify():
    print("--- Verifying Account Balances ---")
    accounts = Account.objects.filter(account_type__in=['CASH', 'BANK', 'EQUITY'])
    for acc in accounts:
        print(f"Account: {acc.name} ({acc.account_type}) | Balance: {acc.balance}")

    print("\n--- Balance Sheet Calculation Check ---")
    assets = Account.objects.filter(account_type__in=['CASH', 'BANK', 'RECEIVABLE', 'ASSET']).aggregate(t=Sum('balance'))['t'] or 0
    liabilities = Account.objects.filter(account_type__in=['PAYABLE', 'LIABILITY']).aggregate(t=Sum('balance'))['t'] or 0
    equity = Account.objects.filter(account_type__in=['EQUITY']).aggregate(t=Sum('balance'))['t'] or 0
    
    # Net Income
    income = Account.objects.filter(account_type__in=['INCOME', 'SALES']).aggregate(t=Sum('balance'))['t'] or 0
    expense = Account.objects.filter(account_type__in=['EXPENSE']).aggregate(t=Sum('balance'))['t'] or 0
    net_income = income + expense
    
    # In our logic:
    # Assets (Positive)
    # Liability (Negative)
    # Equity (Negative)
    # Net Income (Negative if Profit)
    
    print(f"Total Assets: {assets}")
    print(f"Total Liabilities: {liabilities}")
    print(f"Total Capital (Equity Accs): {equity}")
    print(f"Net Income (Retained Earnings): {net_income} (Negative means Credit/Profit)")
    
    total_equity_side = abs(liabilities) + abs(equity + net_income)
    print(f"Assets ({assets}) = Liabilities + Equity ({total_equity_side}) ?")
    
    if abs(assets - total_equity_side) < Decimal('0.01'):
        print("BALANCE SHEET BALANCED! ✅")
    else:
        print("BALANCE SHEET NOT BALANCED ❌")

if __name__ == '__main__':
    verify()
