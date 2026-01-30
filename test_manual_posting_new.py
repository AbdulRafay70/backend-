
import os
import django
import sys
from unittest.mock import MagicMock

# --- MOCKS START ---
def no_op_decorator(*args, **kwargs):
    def decorator(thing):
        return thing
    return decorator

mock_spectacular = MagicMock()
mock_spectacular.utils.extend_schema = no_op_decorator
mock_spectacular.utils.extend_schema_view = no_op_decorator
class MockTypes:
    def __getattr__(self, name):
        return "mock"
    def __call__(self, *args, **kwargs):
        return self
mock_spectacular.types.OpenApiTypes = MockTypes()
mock_spectacular.utils.OpenApiParameter = MockTypes()

sys.modules["drf_spectacular"] = mock_spectacular
sys.modules["drf_spectacular.views"] = mock_spectacular.views
sys.modules["drf_spectacular.utils"] = mock_spectacular.utils
sys.modules["drf_spectacular.openapi"] = mock_spectacular.openapi
sys.modules["drf_spectacular.types"] = mock_spectacular.types

sys.modules["drf_yasg"] = MagicMock()
sys.modules["drf_yasg.utils"] = MagicMock()
sys.modules["drf_yasg.openapi"] = MagicMock()
sys.modules["drf_yasg.views"] = MagicMock()

sys.modules["debug_toolbar"] = MagicMock()
sys.modules["debug_toolbar.middleware"] = MagicMock()
sys.modules["debug_toolbar.urls"] = MagicMock()

sys.modules["pytz"] = MagicMock()

mock_pil = MagicMock()
sys.modules["PIL"] = mock_pil
sys.modules["PIL.Image"] = mock_pil
# --- MOCKS END ---

from decimal import Decimal

# Setup Django Environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import User
from organization.models import Organization, Branch
from ledger.models import Account, LedgerEntry, LedgerLine
from finance.views import manual_posting, reverse_manual_posting, get_account_list
from rest_framework.test import force_authenticate

def run_tests():
    print("=== STARTING MANUAL POSTING VERIFICATION ===")
    
    # 1. Setup Data
    user, _ = User.objects.get_or_create(username="test_admin")
    org, _ = Organization.objects.get_or_create(name="Test Org")
    branch, _ = Branch.objects.get_or_create(name="Test Branch", organization=org)
    
    # Mock user active_organization
    user.active_organization = org
    user.save()
    
    # Create Accounts
    cash_acc, _ = Account.objects.get_or_create(name="Cash Hand", organization=org, defaults={'account_type': 'CASH', 'balance': 1000})
    bank_acc, _ = Account.objects.get_or_create(name="Bank Alfalah", organization=org, defaults={'account_type': 'BANK', 'balance': 5000})
    expense_acc, _ = Account.objects.get_or_create(name="Office Rent", organization=org, defaults={'account_type': 'EXPENSE', 'balance': 0})
    equity_acc, _ = Account.objects.get_or_create(name="Owner Equity", organization=org, defaults={'account_type': 'EQUITY', 'balance': 10000})
    
    print(f"Accounts Prepared: {cash_acc}, {bank_acc}, {expense_acc}, {equity_acc}")
    
    factory = RequestFactory()

    # 2. Test Expense Posting
    print("\n--- Testing Expense Posting ---")
    data_expense = {
        'posting_type': 'expense',
        'amount': '500.00',
        'description': 'Rent Payment',
        'debit_account': expense_acc.id,  # Expense
        'credit_account': cash_acc.id,    # Cash
        'branch_id': branch.id
    }
    
    req = factory.post('/api/finance/manual/post', data_expense, content_type='application/json')
    force_authenticate(req, user=user)
    req.user = user # attach user explicitly
    
    resp = manual_posting(req)
    print(f"Expense Response: {resp.status_code} - {resp.data}")
    
    if resp.status_code == 201:
        entry_id = resp.data['id']
        entry = LedgerEntry.objects.get(id=entry_id)
        print(f"Entry Created: {entry.reference_no} | Amount: {entry.transaction_amount} | Service: {entry.service_type}")
        print(f"Is Manual: {entry.is_manual}")
        
    # 3. Test Capital In (New Feature)
    print("\n--- Testing Capital In ---")
    data_capital = {
        'posting_type': 'capital_in',
        'amount': '10000.00',
        'description': 'Investment',
        'debit_account': bank_acc.id, # Bank
        'credit_account': equity_acc.id, # Equity
        'branch_id': branch.id
    }
    
    req = factory.post('/api/finance/manual/post', data_capital, content_type='application/json')
    force_authenticate(req, user=user)
    req.user = user
    resp = manual_posting(req)
    print(f"Capital Response: {resp.status_code} - {resp.data}")
    
    # 4. Test Reversal
    if resp.status_code == 201:
        cap_entry_id = resp.data['id']
        print(f"\n--- Testing Reversal of Entry {cap_entry_id} ---")
        
        req_rev = factory.post(f'/api/finance/manual/reverse/{cap_entry_id}/', {'remarks': 'Mistake'}, content_type='application/json')
        force_authenticate(req_rev, user=user)
        req_rev.user = user
        
        resp_rev = reverse_manual_posting(req_rev, pk=cap_entry_id)
        print(f"Reversal Response: {resp_rev.status_code} - {resp_rev.data}")
        
        # Verify Reversal
        original = LedgerEntry.objects.get(id=cap_entry_id)
        print(f"Original Reversed: {original.reversed}")
        if resp_rev.status_code == 200:
            reversal_id = resp_rev.data.get('reversal_id')
            if reversal_id:
                rev_entry = LedgerEntry.objects.get(id=reversal_id)
                print(f"Reversal Entry: {rev_entry.id} | Type: {rev_entry.transaction_type} | Reversed Of: {rev_entry.reversed_of_id}")

    # 5. Test Account List
    print("\n--- Testing Account List ---")
    req_list = factory.get('/api/finance/accounts/list')
    force_authenticate(req_list, user=user)
    req_list.user = user
    resp_list = get_account_list(req_list)
    print(f"Account List Response: {resp_list.status_code} | Count: {len(resp_list.data)}")

if __name__ == "__main__":
    run_tests()
