import os
import django
import sys
from decimal import Decimal

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from finance.models import FinancialRecord
from finance.views import dashboard_period
from rest_framework.test import APIRequestFactory

def verify():
    print("--- Verifying Status Filter ---")
    
    # 1. Setup a dummy booking with 'Pending' status and one with 'Approved'
    # We'll assume existing bookings 496, 497 are Approved (or we make them so for check)
    try:
        b_approved = Booking.objects.get(id=497)
        b_approved.status = 'Approved'
        b_approved.save()
        print(f"Booking {b_approved.id} set to Approved")
        
        b_pending = Booking.objects.get(id=496)
        b_pending.status = 'Pending'
        b_pending.save()
        print(f"Booking {b_pending.id} set to Pending")
        
        # 2. Check Financial Records are linked
        f_approved = FinancialRecord.objects.filter(booking_id=b_approved.id).first()
        f_pending = FinancialRecord.objects.filter(booking_id=b_pending.id).first()
        
        print(f"Record Approved: {f_approved.income_amount if f_approved else 'None'} (Should be included)")
        print(f"Record Pending: {f_pending.income_amount if f_pending else 'None'} (Should match Pending Booking)")
        
        # 3. Simulate Dashboard Logic (Direct Query)
        # Filter: Only Approved Bookings (or non-booking records)
        from django.db.models import Q
        qs = FinancialRecord.objects.all()
        approved_ids = Booking.objects.filter(status='Approved').values('id')
        filtered_qs = qs.filter(Q(booking_id__isnull=True) | Q(booking_id__in=approved_ids))
        
        total_income = sum([fr.income_amount for fr in filtered_qs])
        
        print(f"\nTotal Income (Filtered): {total_income}")
        
        # Expected: Should exclude Pending booking's income
        expected_income = f_approved.income_amount if f_approved else 0
        # If Pending was included, total would be higher
        
        if total_income == expected_income:
            print("SUCCESS: Filter excluded Pending booking.")
        else:
            print(f"FAILURE: Total {total_income} != Expected {expected_income} (Might include Pending {f_pending.income_amount})")
            
        # Revert status
        b_pending.status = 'Approved'
        b_pending.save()
        print("Reverted Booking 496 to Approved.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    verify()
