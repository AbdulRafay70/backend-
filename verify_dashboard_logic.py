import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from finance.models import FinancialRecord

def verify():
    # Only check for today or recent to match what user sees, or all time?
    # User showed values for specific period likely. I'll check ALL time totals to see if math holds.
    # User's example: Income 73300, Expense 0 (Old), Profit 35150 (Old logic?)
    # Profit was ~ 73300 - 38150 = 35150.
    # So Expense (Purchase) was 38150.
    
    qs = FinancialRecord.objects.all()
    
    total_income = sum([fr.income_amount for fr in qs])
    total_purchase = sum([fr.purchase_cost or Decimal('0.00') for fr in qs])
    total_expenses_field = sum([fr.expenses_amount for fr in qs])
    
    # New Logic for Dashboard "Total Expense"
    dashboard_total_expenses = total_purchase
    
    # New Logic for Dashboard "Total Profit"
    dashboard_total_profit = total_income - dashboard_total_expenses
    
    print(f"Total Income: {total_income}")
    print(f"Total Purchase (Now 'Total Expense'): {total_purchase}")
    print(f"Total Expense Field (Old): {total_expenses_field}")
    
    print(f"Simulated Dashboard Profit: {dashboard_total_profit}")
    
    # Check individual records
    print("\n--- Breakdown ---")
    for fr in qs:
        print(f"ID: {fr.id}, Income: {fr.income_amount}, Purchase: {fr.purchase_cost}, Profit(Field): {fr.profit_loss}")
        
if __name__ == '__main__':
    verify()
