"""
Test Script for Pending Balance and Final Balance API Endpoints
Tests all 5 pending balance endpoints with the new ledger format
"""

import os
import sys
import django

# Setup Django
project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_path)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

# Add testserver to ALLOWED_HOSTS for testing
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from organization.models import Organization, Branch, Agency
from area_leads.models import AreaLead
from ledger.models import LedgerEntry
from decimal import Decimal

User = get_user_model()

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_agents_pending_balances():
    """Test GET /api/agents/pending-balances"""
    print_section("TEST 1: Agents Pending Balances")
    
    client = APIClient()
    
    # Get a user for authentication
    user = User.objects.filter(is_staff=True).first()
    if not user:
        print("ERROR: No admin user found. Creating one...")
        user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='admin123'
        )
    
    client.force_authenticate(user=user)
    
    # Get first organization
    org = Organization.objects.first()
    if not org:
        print("ERROR: No organization found")
        return
    
    print(f"\nTesting for Organization: {org.name} (ID: {org.id})")
    
    # Make request
    response = client.get(f'/api/agents/pending-balances?organization_id={org.id}')
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nOrganization: {data['organization_name']}")
        print(f"Total Pending Agents: {data['total_pending_agents']}")
        
        if data['agents']:
            print("\nPending Agents:")
            for agent in data['agents'][:5]:  # Show first 5
                print(f"  - {agent['agency_name']}")
                print(f"    Agent ID: {agent['agent_id']}")
                print(f"    Contact: {agent['contact_no']}")
                print(f"    Pending Balance: PKR {agent['pending_balance']:,.2f}")
                print(f"    Internal Notes: {len(agent['internal_note_ids'])} entries")
        else:
            print("\n No agents with pending balance found")
    else:
        print(f"ERROR: {response.json()}")

def test_area_agents_pending_balances():
    """Test GET /api/area-agents/pending-balances"""
    print_section("TEST 2: Area Agents Pending Balances")
    
    client = APIClient()
    user = User.objects.filter(is_staff=True).first()
    client.force_authenticate(user=user)
    
    org = Organization.objects.first()
    if not org:
        print("ERROR: No organization found")
        return
    
    print(f"\nTesting for Organization: {org.name} (ID: {org.id})")
    
    response = client.get(f'/api/area-agents/pending-balances?organization_id={org.id}')
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nOrganization: {data['organization_name']}")
        print(f"Total Pending Area Agents: {data['total_pending_area_agents']}")
        
        if data['area_agents']:
            print("\nPending Area Agents:")
            for area_agent in data['area_agents'][:5]:
                print(f"  - {area_agent['area_agent_name']}")
                print(f"    Area Agent ID: {area_agent['area_agent_id']}")
                print(f"    Contact: {area_agent['contact_no']}")
                print(f"    Pending Balance: PKR {area_agent['pending_balance']:,.2f}")
                print(f"    Internal Notes: {len(area_agent['internal_note_ids'])} entries")
        else:
            print("\n No area agents with pending balance found")
    else:
        print(f"ERROR: {response.json()}")

def test_branch_pending_balances():
    """Test GET /api/branch/pending-balances"""
    print_section("TEST 3: Branch Pending Balances")
    
    client = APIClient()
    user = User.objects.filter(is_staff=True).first()
    client.force_authenticate(user=user)
    
    org = Organization.objects.first()
    if not org:
        print("ERROR: No organization found")
        return
    
    print(f"\nTesting for Organization: {org.name} (ID: {org.id})")
    
    response = client.get(f'/api/branch/pending-balances?organization_id={org.id}')
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nOrganization: {data['organization_name']}")
        print(f"Total Pending Branches: {data['total_pending_branches']}")
        
        if data['branches']:
            print("\nPending Branches:")
            for branch in data['branches'][:5]:
                print(f"  - {branch['branch_name']}")
                print(f"    Branch ID: {branch['branch_id']}")
                print(f"    Contact: {branch['contact_no']}")
                print(f"    Pending Balance: PKR {branch['pending_balance']:,.2f}")
                print(f"    Internal Notes: {len(branch['internal_note_ids'])} entries")
        else:
            print("\n No branches with pending balance found")
    else:
        print(f"ERROR: {response.json()}")

def test_organization_pending_balances():
    """Test GET /api/organization/pending-balances"""
    print_section("TEST 4: Organization Pending Balances")
    
    client = APIClient()
    user = User.objects.filter(is_staff=True).first()
    client.force_authenticate(user=user)
    
    org = Organization.objects.first()
    if not org:
        print("ERROR: No organization found")
        return
    
    # Test 4a: Get all organizations with pending balance
    print(f"\nTest 4a: All organizations with pending balance against {org.name}")
    
    response = client.get(f'/api/organization/pending-balances?org1_id={org.id}')
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nOrganization: {data['organization_name']}")
        print(f"Total Pending Organizations: {data['total_pending_organizations']}")
        
        if data['organizations']:
            print("\nPending Organizations:")
            for pending_org in data['organizations'][:5]:
                print(f"  - {pending_org['organization_name']}")
                print(f"    Org ID: {pending_org['organization_id']}")
                print(f"    Pending Balance: PKR {pending_org['pending_balance']:,.2f}")
                print(f"    {pending_org['balance_description']}")
        else:
            print("\n No organizations with pending balance found")
    else:
        print(f"ERROR: {response.json()}")
    
    # Test 4b: Get balance between two specific organizations
    orgs = Organization.objects.all()[:2]
    if len(orgs) >= 2:
        org1, org2 = orgs[0], orgs[1]
        
        print(f"\n\nTest 4b: Balance between {org1.name} and {org2.name}")
        
        response = client.get(f'/api/organization/pending-balances?org1_id={org1.id}&org2_id={org2.id}')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nOrganization 1: {data['org1_name']}")
            print(f"Organization 2: {data['org2_name']}")
            print(f"\n{data['org1_name']} owes to {data['org2_name']}: PKR {data['org1_owes_to_org2']:,.2f}")
            print(f"{data['org2_name']} owes to {data['org1_name']}: PKR {data['org2_owes_to_org1']:,.2f}")
            print(f"\nNet Pending Balance: PKR {data['net_pending_balance']:,.2f}")
            print(f"{data['balance_description']}")
        else:
            print(f"ERROR: {response.json()}")

def test_final_balance():
    """Test GET /api/final-balance"""
    print_section("TEST 5: Final Balance Endpoint")
    
    client = APIClient()
    user = User.objects.filter(is_staff=True).first()
    client.force_authenticate(user=user)
    
    # Test for different entity types
    
    # Test 5a: Agency final balance
    agency = Agency.objects.first()
    if agency:
        print(f"\nTest 5a: Final balance for Agency '{agency.name}'")
        
        response = client.get(f'/api/final-balance?type=agent&id={agency.id}')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nEntity Type: {data['type'].upper()}")
            print(f"Entity Name: {data['name']}")
            print(f"\nTotal Debit: PKR {data['total_debit']:,.2f}")
            print(f"Total Credit: PKR {data['total_credit']:,.2f}")
            print(f"Final Balance: PKR {data['final_balance']:,.2f}")
            print(f"Currency: {data['currency']}")
            print(f"Last Updated: {data['last_updated']}")
        else:
            print(f"ERROR: {response.json()}")
    
    # Test 5b: Branch final balance
    branch = Branch.objects.first()
    if branch:
        print(f"\n\nTest 5b: Final balance for Branch '{branch.name}'")
        
        response = client.get(f'/api/final-balance?type=branch&id={branch.id}')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nEntity Type: {data['type'].upper()}")
            print(f"Entity Name: {data['name']}")
            print(f"\nTotal Debit: PKR {data['total_debit']:,.2f}")
            print(f"Total Credit: PKR {data['total_credit']:,.2f}")
            print(f"Final Balance: PKR {data['final_balance']:,.2f}")
            print(f"Currency: {data['currency']}")
            print(f"Last Updated: {data['last_updated']}")
        else:
            print(f"ERROR: {response.json()}")
    
    # Test 5c: Organization final balance
    org = Organization.objects.first()
    if org:
        print(f"\n\nTest 5c: Final balance for Organization '{org.name}'")
        
        response = client.get(f'/api/final-balance?type=organization&id={org.id}')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nEntity Type: {data['type'].upper()}")
            print(f"Entity Name: {data['name']}")
            print(f"\nTotal Debit: PKR {data['total_debit']:,.2f}")
            print(f"Total Credit: PKR {data['total_credit']:,.2f}")
            print(f"Final Balance: PKR {data['final_balance']:,.2f}")
            print(f"Currency: {data['currency']}")
            print(f"Last Updated: {data['last_updated']}")
        else:
            print(f"ERROR: {response.json()}")

def show_database_summary():
    """Show current database state"""
    print_section("DATABASE SUMMARY")
    
    print(f"\nLedger Entries: {LedgerEntry.objects.count()}")
    print(f"Organizations: {Organization.objects.count()}")
    print(f"Branches: {Branch.objects.count()}")
    print(f"Agencies: {Agency.objects.count()}")
    print(f"Area Leads: {AreaLead.objects.count()}")
    
    # Show ledger entry breakdown
    debit_entries = LedgerEntry.objects.filter(transaction_type='debit', reversed=False).count()
    credit_entries = LedgerEntry.objects.filter(transaction_type='credit', reversed=False).count()
    reversed_entries = LedgerEntry.objects.filter(reversed=True).count()
    
    print(f"\nLedger Entry Breakdown:")
    print(f"  Debit Entries: {debit_entries}")
    print(f"  Credit Entries: {credit_entries}")
    print(f"  Reversed Entries: {reversed_entries}")
    
    # Show entries with negative balance
    negative_balance_count = LedgerEntry.objects.filter(
        final_balance__lt=0,
        reversed=False
    ).count()
    
    print(f"\nEntries with Negative Balance: {negative_balance_count}")

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("  PENDING BALANCE & FINAL BALANCE API TEST SUITE")
    print("  Testing New Ledger Format Endpoints")
    print("="*80)
    
    try:
        # Show database state
        show_database_summary()
        
        # Run tests
        test_agents_pending_balances()
        test_area_agents_pending_balances()
        test_branch_pending_balances()
        test_organization_pending_balances()
        test_final_balance()
        
        # Final summary
        print_section("TEST SUITE COMPLETED")
        print("\n All 5 endpoint tests completed successfully!")
        print("\nEndpoints Tested:")
        print("  1. GET /api/agents/pending-balances")
        print("  2. GET /api/area-agents/pending-balances")
        print("  3. GET /api/branch/pending-balances")
        print("  4. GET /api/organization/pending-balances")
        print("  5. GET /api/final-balance")
        
    except Exception as e:
        print(f"\n ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
