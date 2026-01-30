import requests
import json
from decimal import Decimal

BASE_URL = "http://127.0.0.1:8000/api/finance/manual/post"
# Assuming we have a valid token or session. 
# Since I cannot easily login in script without password, I will run this via `python manage.py shell` logic or just curl equivalent.
# Actually, I can use `python manage.py shell` and direct function call to test logic without HTTP overhead essentially, 
# or construct a mock request. But real HTTP is better.
# Let's create a script that sets up environment and calls logic directly for faster debug.

import os
import sys
import django
from django.conf import settings

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from finance.views import manual_posting
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User
from ledger.models import Account, LedgerEntry
from organization.models import Organization

def test_manual_posting():
    print("--- Testing Manual Posting Logic ---")
    
    # Setup User and Org
    u = User.objects.first()
    org = Organization.objects.first()
    
    # Simulate middleware adding active_organization to user instance
    u.active_organization = org
    # Note: trying to save u.active_organization will fail if the field doesn't exist in DB.
    # It is likely added effectively at runtime by middleware.
    # So we just set it on the instance 'u' which will be used in request.
    
    factory = APIRequestFactory()
    
    # 1. Test Expense Posting
    # Need accounts
    cash = Account.objects.filter(account_type='CASH').first()
    expense = Account.objects.filter(account_type='EXPENSE').first()
    
    if not cash or not expense:
        print("Skipping: Setup accounts first")
        return

    print(f"Testing Expense: {expense.name} (Dr) -> {cash.name} (Cr)")
    
    payload = {
        'posting_type': 'expense',
        'date': '2025-10-15',
        'description': 'Test Office Renovation',
        'amount': '5000',
        'debit_account': expense.id,
        'credit_account': cash.id,
        'branch_id': 1
    }
    
    req = factory.post(BASE_URL, payload, format='json')
    force_authenticate(req, user=u)
    
    resp = manual_posting(req)
    print(f"Response: {resp.status_code} - {resp.data}")
    
    if resp.status_code == 201:
        entry_id = resp.data['id']
        le = LedgerEntry.objects.get(id=entry_id)
        print(f"Created Entry: {le}")
        for line in le.lines.all():
            print(f"  Line: {line.account.name} | Dr: {line.debit} | Cr: {line.credit} | Bal: {line.balance_after}")

if __name__ == '__main__':
    test_manual_posting()
