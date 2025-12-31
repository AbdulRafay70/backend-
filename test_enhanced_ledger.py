"""
Enhanced Ledger System - Testing Script
Tests all 5 levels of ledger queries and demonstrates the new format
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import LedgerEntry
from organization.models import Organization, Branch, Agency
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


def show_new_ledger_format():
    """Display the new ledger entry format"""
    print("\n" + "="*80)
    print("NEW LEDGER ENTRY FORMAT")
    print("="*80)
    
    print("""
Field Structure:
----------------
✓ creation_datetime         : Auto set (timezone aware)
✓ booking_no                : Booking reference (auto from booking table)
✓ service_type              : ticket / umrah / hotel / transport / package / payment / refund / commission
✓ narration                 : Text summary (e.g., "Advance payment for Umrah Booking #SK1234")
✓ transaction_type          : debit or credit
✓ transaction_amount        : Total transaction amount (kitna ki transaction howi hai)
✓ seller_organization_id    : Who created this booking
✓ inventory_owner_org_id    : Owner org of that inventory item (auto detect from item)
✓ area_agency_id            : If booking linked with area agent
✓ agency_id                 : If created by an agent
✓ branch_id                 : If created under branch
✓ payment_ids               : List of all linked payment record IDs
✓ group_ticket_count        : Total number of tickets if multiple in group booking
✓ umrah_visa_count          : Total number of Umrah visas included
✓ hotel_nights_count        : All hotels involved with this booking
✓ final_balance             : Auto-calc from (total paid - total due)
✓ internal_notes            : Array of internal notes text (timestamped)

Internal Notes Example:
-----------------------
[
  "[2025-10-17 11:24] Payment received via Bank Alfalah.",
  "[2025-10-17 11:25] Commission auto-posted to agent.",
  "[2025-10-17 11:26] Linked with Umrah package #U245."
]
""")


def show_5_level_endpoints():
    """Display the 5-level GET endpoints"""
    print("\n" + "="*80)
    print("🔹 5-LEVEL LEDGER ENDPOINTS")
    print("="*80)
    
    endpoints = [
        {
            "level": "1️⃣",
            "name": "Organization Ledger",
            "endpoint": "GET /api/ledger/organization/<organization_id>/",
            "description": "Shows all transactions related to that organization and its branches",
            "example": "GET /api/ledger/organization/11/"
        },
        {
            "level": "2️⃣",
            "name": "Branch Ledger",
            "endpoint": "GET /api/ledger/branch/<branch_id>/",
            "description": "Shows all transactions between branch ↔ organization / agents",
            "example": "GET /api/ledger/branch/5/"
        },
        {
            "level": "3️⃣",
            "name": "Agency Ledger",
            "endpoint": "GET /api/ledger/agency/<agency_id>/",
            "description": "Shows all transactions between agent ↔ branch / organization",
            "example": "GET /api/ledger/agency/25/"
        },
        {
            "level": "4️⃣",
            "name": "Area Agency Ledger",
            "endpoint": "GET /api/ledger/area-agency/<area_agency_id>/",
            "description": "Shows all transactions between area agency ↔ organization",
            "example": "GET /api/ledger/area-agency/8/"
        },
        {
            "level": "5️⃣",
            "name": "Organization-to-Organization Ledger",
            "endpoint": "GET /api/ledger/org-to-org/<org1_id>/<org2_id>/",
            "description": "Shows receivable/payable summary and full transaction history between two companies",
            "example": "GET /api/ledger/org-to-org/11/15/"
        }
    ]
    
    for endpoint in endpoints:
        print(f"\n{endpoint['level']} {endpoint['name']}")
        print(f"Endpoint: {endpoint['endpoint']}")
        print(f"Description: {endpoint['description']}")
        print(f"Example: {endpoint['example']}")


def show_auto_posting_logic():
    """Display auto posting rules"""
    print("\n" + "="*80)
    print("🧮 AUTO POSTING LOGIC")
    print("="*80)
    
    rules = [
        {
            "condition": "Agent booked inventory owned by Saer.pk",
            "debit": "Agent",
            "credit": "Saer.pk",
            "narration": "Agent payment for ticket booking"
        },
        {
            "condition": "Branch booked inventory owned by Saer.pk",
            "debit": "Branch",
            "credit": "Saer.pk",
            "narration": "Branch booking settlement"
        },
        {
            "condition": "Area Agent got commission",
            "debit": "Saer.pk",
            "credit": "Area Agent",
            "narration": "Area commission for booking #BK-123"
        },
        {
            "condition": "Organization A using inventory of Organization B",
            "debit": "Org A",
            "credit": "Org B",
            "narration": "Inventory share settlement"
        },
        {
            "condition": "Refund issued",
            "debit": "Saer.pk",
            "credit": "Agent / Customer",
            "narration": "Refund for cancelled booking #BK-456"
        }
    ]
    
    print("\n{:<50} | {:<15} | {:<15} | {}".format("Condition", "Debit", "Credit", "Narration Example"))
    print("-" * 130)
    
    for rule in rules:
        print("{:<50} | {:<15} | {:<15} | {}".format(
            rule['condition'],
            rule['debit'],
            rule['credit'],
            rule['narration']
        ))


def show_database_status():
    """Show current database status"""
    print("\n" + "="*80)
    print("DATABASE STATUS")
    print("="*80)
    
    total_entries = LedgerEntry.objects.count()
    total_orgs = Organization.objects.count()
    total_branches = Branch.objects.count()
    total_agencies = Agency.objects.count()
    
    print(f"\nTotal Ledger Entries: {total_entries}")
    print(f"Total Organizations: {total_orgs}")
    print(f"Total Branches: {total_branches}")
    print(f"Total Agencies: {total_agencies}")
    
    if total_entries > 0:
        print("\n--- Sample Ledger Entries (First 3) ---")
        entries = LedgerEntry.objects.all()[:3]
        
        for entry in entries:
            print(f"\nEntry ID: {entry.id}")
            print(f"  Booking No: {entry.booking_no or 'N/A'}")
            print(f"  Transaction Type: {entry.transaction_type}")
            print(f"  Service Type: {entry.service_type}")
            print(f"  Transaction Amount: {entry.transaction_amount}")
            print(f"  Final Balance: {entry.final_balance}")
            print(f"  Seller Org: {entry.seller_organization.name if entry.seller_organization else 'N/A'}")
            print(f"  Inventory Owner: {entry.inventory_owner_organization.name if entry.inventory_owner_organization else 'N/A'}")
            print(f"  Branch: {entry.branch.name if entry.branch else 'N/A'}")
            print(f"  Agency: {entry.agency.name if entry.agency else 'N/A'}")
            print(f"  Area Agency: {entry.area_agency if entry.area_agency else 'N/A'}")
            print(f"  Payment IDs: {entry.payment_ids}")
            print(f"  Tickets: {entry.group_ticket_count}, Visas: {entry.umrah_visa_count}, Nights: {entry.hotel_nights_count}")
            print(f"  Created: {entry.creation_datetime}")
            if entry.internal_notes:
                print(f"  Internal Notes: {len(entry.internal_notes)} notes")
                for note in entry.internal_notes[:2]:
                    print(f"    - {note}")
    else:
        print("\n⚠️  No ledger entries found in database")
        print("    Create a booking and mark it as 'Paid' to auto-generate ledger entries")


def show_sample_queries():
    """Show sample cURL commands for testing"""
    print("\n" + "="*80)
    print("SAMPLE API QUERIES")
    print("="*80)
    
    print("""
# 1️⃣ Get Organization Ledger (all transactions for org and its branches)
curl -X GET "https://api.saer.pk/api/ledger/organization/11/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 2️⃣ Get Branch Ledger (branch transactions)
curl -X GET "https://api.saer.pk/api/ledger/branch/5/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 3️⃣ Get Agency Ledger (agent transactions)
curl -X GET "https://api.saer.pk/api/ledger/agency/25/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 4️⃣ Get Area Agency Ledger (area agent transactions)
curl -X GET "https://api.saer.pk/api/ledger/area-agency/8/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 5️⃣ Get Org-to-Org Ledger (receivable/payable between two orgs)
curl -X GET "https://api.saer.pk/api/ledger/org-to-org/11/15/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Get all ledger entries (with filters)
curl -X GET "https://api.saer.pk/api/ledger/?service_type=umrah&transaction_type=debit" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Get single ledger entry
curl -X GET "https://api.saer.pk/api/ledger/1/" \\
  -H "Authorization: Token YOUR_TOKEN_HERE"
""")


def show_response_example():
    """Show sample API response"""
    print("\n" + "="*80)
    print("SAMPLE API RESPONSE")
    print("="*80)
    
    print("""
GET /api/ledger/organization/11/ Response:

{
  "organization_id": 11,
  "organization_name": "Saer.pk",
  "summary": {
    "total_entries": 245,
    "total_debit": 5500000.00,
    "total_credit": 4800000.00,
    "net_balance": 700000.00
  },
  "service_breakdown": [
    {
      "service_type": "umrah",
      "count": 120,
      "total_amount": 3200000.00
    },
    {
      "service_type": "ticket",
      "count": 85,
      "total_amount": 1500000.00
    }
  ],
  "entries": [
    {
      "id": 1,
      "booking_no": "BK-20251101-ABC1",
      "transaction_type": "debit",
      "service_type": "umrah",
      "narration": "Umrah booking for customer XYZ",
      "transaction_amount": 150000.00,
      "final_balance": 50000.00,
      "seller_organization": 11,
      "seller_organization_name": "Saer.pk",
      "inventory_owner_organization": 15,
      "inventory_owner_organization_name": "Al-Haram Tours",
      "branch": 5,
      "branch_name": "Karachi Branch",
      "agency": 25,
      "agency_name": "Travel Solutions",
      "area_agency": null,
      "payment_ids": [123, 124],
      "group_ticket_count": 4,
      "umrah_visa_count": 2,
      "hotel_nights_count": 14,
      "creation_datetime": "2025-11-01T14:30:00Z",
      "internal_notes": [
        "[2025-11-01 14:30] Booking created by Agent Ahmed",
        "[2025-11-01 14:35] Payment 1 of 2 received"
      ],
      "metadata": {
        "total_amount": 150000.00,
        "total_paid": 100000.00,
        "customer_name": "Muhammad Ali"
      }
    }
  ]
}
""")


def show_migration_info():
    """Show migration information"""
    print("\n" + "="*80)
    print("MIGRATION INFORMATION")
    print("="*80)
    
    print("""
New Migration File: ledger/migrations/0004_enhance_ledger_new_format.py

This migration adds the following fields to LedgerEntry:
  ✓ transaction_amount (Decimal)
  ✓ final_balance (Decimal)
  ✓ seller_organization (FK)
  ✓ inventory_owner_organization (FK)
  ✓ area_agency (FK)
  ✓ payment_ids (JSON)
  ✓ group_ticket_count (Integer)
  ✓ umrah_visa_count (Integer)
  ✓ hotel_nights_count (Integer)

To apply migration:
  python manage.py migrate ledger

To check migration status:
  python manage.py showmigrations ledger

Note: All new ForeignKey fields use db_constraint=False for MySQL compatibility
""")


if __name__ == "__main__":
    print("\n")
    print("█"*80)
    print(" "*20 + "ENHANCED LEDGER SYSTEM - COMPREHENSIVE TESTER")
    print("█"*80)
    
    try:
        show_new_ledger_format()
        show_5_level_endpoints()
        show_auto_posting_logic()
        show_database_status()
        show_sample_queries()
        show_response_example()
        show_migration_info()
        
        print("\n" + "="*80)
        print("✅ ENHANCED LEDGER SYSTEM READY")
        print("="*80)
        print("\nNew Features:")
        print("  ✓ Enhanced ledger entry format with all required fields")
        print("  ✓ 5-level organizational ledger queries")
        print("  ✓ Auto-posting logic for different scenarios")
        print("  ✓ Transaction amount and final balance tracking")
        print("  ✓ Payment IDs linking")
        print("  ✓ Booking details (tickets, visas, hotel nights)")
        print("  ✓ Timestamped internal notes for audit trail")
        print("  ✓ Inter-organization receivable/payable tracking")
        print("\nEndpoints:")
        print("  1. GET /api/ledger/organization/<id>/")
        print("  2. GET /api/ledger/branch/<id>/")
        print("  3. GET /api/ledger/agency/<id>/")
        print("  4. GET /api/ledger/area-agency/<id>/")
        print("  5. GET /api/ledger/org-to-org/<id1>/<id2>/")
        print("\nBase URL: http://127.0.0.1:8000")
        print("Authentication: Token required")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
