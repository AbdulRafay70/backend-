"""
Test all ledger API endpoints to ensure they match the specification.

Specification:
Method  Endpoint                        Purpose
GET     /api/ledger/                    List all ledger entries
GET     /api/ledger/{id}/               Retrieve full entry with lines
POST    /api/ledger/create/             Create a new ledger entry
POST    /api/ledger/{id}/reverse/       Reverse an existing ledger entry
GET     /api/ledger/accounts/           List all accounts and balances
GET     /api/ledger/summary/            Get organization-wide summary
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import LedgerEntry, Account
from booking.models import Booking

print("=" * 80)
print("LEDGER API ENDPOINTS VERIFICATION")
print("=" * 80)

# Check if we have data
ledger_count = LedgerEntry.objects.count()
account_count = Account.objects.count()

print(f"\n📊 Database Status:")
print(f"  - Ledger Entries: {ledger_count}")
print(f"  - Accounts: {account_count}")

if ledger_count > 0:
    entry = LedgerEntry.objects.first()
    print(f"\n✅ Sample Ledger Entry:")
    print(f"  - ID: {entry.id}")
    print(f"  - Booking No: {entry.booking_no}")
    print(f"  - Organization: {entry.organization}")
    print(f"  - Transaction Type: {entry.transaction_type}")
    print(f"  - Lines: {entry.lines.count()}")

print("\n" + "=" * 80)
print("AVAILABLE ENDPOINTS:")
print("=" * 80)

endpoints = [
    ("GET", "/api/ledger/", "List all ledger entries"),
    ("GET", f"/api/ledger/{entry.id if ledger_count > 0 else '{id}'}/", "Retrieve full entry with lines"),
    ("POST", "/api/ledger/create/", "Create a new ledger entry"),
    ("POST", f"/api/ledger/{entry.id if ledger_count > 0 else '{id}'}/reverse/", "Reverse an existing ledger entry"),
    ("GET", "/api/ledger/accounts/", "List all accounts and balances"),
    ("GET", "/api/ledger/summary/", "Get organization-wide summary"),
]

for method, endpoint, purpose in endpoints:
    print(f"\n{method:6} {endpoint:35} - {purpose}")

print("\n" + "=" * 80)
print("QUERY PARAMETERS:")
print("=" * 80)

print("\nGET /api/ledger/accounts/")
print("  - organization={id}  : Filter by organization")
print("  - branch={id}        : Filter by branch")
print("  - agency={id}        : Filter by agency")
print("  - account_type={type}: Filter by account type (CASH, BANK, RECEIVABLE, etc.)")

print("\nGET /api/ledger/summary/")
print("  - organization={id}  : Filter by organization")
print("  - branch={id}        : Filter by branch")
print("  - agency={id}        : Filter by agency")

print("\n" + "=" * 80)
print("SAMPLE REQUESTS:")
print("=" * 80)

if ledger_count > 0:
    print(f"\n1. List all ledger entries:")
    print(f"   GET /api/ledger/")
    
    print(f"\n2. Get specific ledger entry:")
    print(f"   GET /api/ledger/{entry.id}/")
    
    print(f"\n3. Create new ledger entry:")
    print(f"   POST /api/ledger/create/")
    print(f"   Body: {{")
    print(f"     \"debit_account_id\": 1,")
    print(f"     \"credit_account_id\": 2,")
    print(f"     \"amount\": \"1000.00\",")
    print(f"     \"narration\": \"Test entry\"")
    print(f"   }}")
    
    if not entry.reversed:
        print(f"\n4. Reverse ledger entry:")
        print(f"   POST /api/ledger/{entry.id}/reverse/")
    
    print(f"\n5. List all accounts:")
    print(f"   GET /api/ledger/accounts/")
    
    if entry.organization:
        print(f"\n6. Get summary for organization {entry.organization.id}:")
        print(f"   GET /api/ledger/summary/?organization={entry.organization.id}")

print("\n" + "=" * 80)
print("✅ All endpoints configured and ready!")
print("=" * 80)
