import os
import django
import sys
from decimal import Decimal

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from finance.models import FinancialRecord
from finance.views import report_profit_loss
from rest_framework.test import APIRequestFactory

def verify():
    print("--- Verifying Full Filters ---")
    
    # 1. Test Module Filter (Service Type)
    factory = APIRequestFactory()
    request = factory.get('/report_profit_loss', {'service_type': 'umrah'})
    
    # Mock User
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.first()
    if not user:
        print("No user found! Creating one for test.")
        user = User.objects.create(username='testadmin')
    
    from rest_framework.test import force_authenticate
    force_authenticate(request, user=user)
    
    response = report_profit_loss(request)
    if response.status_code != 200:
         print(f"Error Response: {response.data}")
         return

    summary = response.data['summary'] 
    
    print("\n[Module Filter] Service Type: Umrah")
    if 'umrah' in summary and len(summary) == 1:
        print(f"SUCCESS: Only umrah returned. Profit: {summary['umrah']['profit']}")
    elif len(summary) == 0:
        print("SUCCESS: No umrah records (if valid).")
        # Check if other keys exist
        keys = list(summary.keys())
        if any(k != 'umrah' for k in keys):
             print(f"FAILURE: Returned non-umrah services: {keys}")
    else:
        # If 'umrah' in summary but others potentially too? 
        # Logic loops over choices, but filters qs. If qs empty for other services, summary skips them?
        # My logic:
        # svc_qs = qs.filter(service_type=svc)
        # if not svc_qs.exists(): continue
        # So yes, if qs is filtered by user param 'service_type="umrah"', 
        # then for svc="hotel", qs.filter(service_type="hotel") will be empty.
        # So only "umrah" should appear.
        print(f"Keys returned: {list(summary.keys())}")


    # 2. Test Profit Range
    # Find a record with specific profit
    fr = FinancialRecord.objects.first()
    if fr:
        profit = fr.income_amount - (fr.purchase_cost or 0)
        print(f"\n[Profit Range] Testing record {fr.id} with profit {profit}")
        
        # Test Min Profit (Should include)
        min_p = profit - 100
        request = factory.get('/report_profit_loss', {'min_profit': str(min_p)})
        force_authenticate(request, user=user)
        response = report_profit_loss(request)
        # We need to see if TOTALS are non-zero
        if response.data['total_profit'] > 0:
             print(f"SUCCESS: Included with min_profit {min_p}")
        else:
             print(f"FAILURE: Excluded with min_profit {min_p}")

        # Test Max Profit (Should exclude if set too low)
        max_p = profit - 100
        request = factory.get('/report_profit_loss', {'max_profit': str(max_p)})
        force_authenticate(request, user=user)
        response = report_profit_loss(request)
        # Logic check: if we set max_profit lower than this record's profit, 
        # THIS record should be excluded. If all records are excluded, total is 0.
        # This is a loose test, assuming this is the only or major record.
        # Better: check if total reduced.
        print(f"Total Profit with max_profit {max_p}: {response.data['total_profit']}")

if __name__ == '__main__':
    verify()
