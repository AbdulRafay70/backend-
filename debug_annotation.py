import os
import django
import sys
from decimal import Decimal

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from finance.models import FinancialRecord
from django.db.models import F, Value, DecimalField
from django.db.models.functions import Coalesce

def debug():
    print("--- Debugging Annotation ---")
    
    qs = FinancialRecord.objects.all().annotate(
        record_profit=F('income_amount') - Coalesce('purchase_cost', Value(0), output_field=DecimalField())
    )
    
    for fr in qs:
        print(f"ID: {fr.id}, Income: {fr.income_amount}, Purchase: {fr.purchase_cost}, CalcProfit: {fr.record_profit}")
        
    # Test Filter
    min_p = Decimal('75200')
    filtered_qs = qs.filter(record_profit__gte=min_p)
    print(f"\nFiltering profit >= {min_p}")
    for fr in filtered_qs:
        print(f"MATCH: ID: {fr.id}, Profit: {fr.record_profit}")
        
    if not filtered_qs.exists():
        print("NO MATCHES FOUND")

if __name__ == '__main__':
    debug()
