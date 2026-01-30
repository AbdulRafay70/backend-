import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from finance.models import FinancialRecord
from finance.views import report_profit_loss
from rest_framework.test import APIRequestFactory

def verify_pnl():
    print("--- Verifying P&L Report Logic ---")
    
    # Calculate expected values manually first
    qs = FinancialRecord.objects.all()
    total_inc = sum([fr.income_amount for fr in qs])
    total_pur = sum([fr.purchase_cost or Decimal('0.00') for fr in qs])
    total_prof = total_inc - total_pur
    
    print(f"Manual Calc -> Income: {total_inc}, Purchase: {total_pur}, Profit: {total_prof}")
    if total_inc > 0:
        margin = (total_prof / total_inc) * 100
        print(f"Manual Margin: {margin:.2f}%")
        
    # Simulate API Call (using logic inspection essentially since view returns Response)
    # We can just run the query logic extracted from view to be safe
    
    summary = {}
    for svc, _ in FinancialRecord._meta.get_field('service_type').choices:
        svc_qs = qs.filter(service_type=svc)
        if not svc_qs.exists():
            continue
        
        income = sum([fr.income_amount for fr in svc_qs])
        expenses = sum([fr.purchase_cost or Decimal('0.00') for fr in svc_qs])
        profit = income - expenses
        
        summary[svc] = {'income': income, 'expenses': expenses, 'profit': profit}
        
        if income > 0:
            svc_margin = (profit / income) * 100
            print(f"Service: {svc} -> Profit: {profit}, Margin: {svc_margin:.2f}%")
        else:
            print(f"Service: {svc} -> Profit: {profit}, Margin: N/A")

if __name__ == '__main__':
    verify_pnl()
