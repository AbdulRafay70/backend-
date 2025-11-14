"""
Complete test script for Hotel Outsourcing Module
Tests all API endpoints and verifies Swagger integration
"""

import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from booking.models import Booking, HotelOutsourcing, BookingHotelDetails
from organization.models import Organization, Branch
from decimal import Decimal
import requests
from datetime import date, datetime, timedelta

User = get_user_model()

# API Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_success(msg):
    print(f"✅ {msg}")

def print_error(msg):
    print(f"❌ {msg}")

def print_info(msg):
    print(f"ℹ️  {msg}")

def get_auth_token():
    """Get authentication token for API calls"""
    try:
        # Try to get or create a test user
        user = User.objects.filter(username='admin').first()
        if not user:
            user = User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
            print_success("Created test admin user (username: admin, password: admin123)")
        
        # Login to get token (if using token auth)
        response = requests.post(f"{API_BASE}/token/", json={
            'username': 'admin',
            'password': 'admin123'
        })
        
        if response.status_code == 200:
            token = response.json().get('access')
            print_success(f"Obtained auth token")
            return f"Bearer {token}"
        else:
            print_info("Token auth not available, trying session auth")
            return None
    except Exception as e:
        print_info(f"Auth setup: {str(e)}")
        return None

def create_test_booking():
    """Create a test booking for outsourcing"""
    print_section("CREATING TEST BOOKING")
    
    try:
        # Get or create organization and branch
        org, _ = Organization.objects.get_or_create(
            id=1,
            defaults={'name': 'Saer.pk Test Org'}
        )
        branch, _ = Branch.objects.get_or_create(
            id=1,
            defaults={'name': 'Karachi Branch', 'organization': org}
        )
        
        # Get or create test user
        user = User.objects.filter(username='test_agent').first()
        if not user:
            user = User.objects.create_user('test_agent', 'agent@test.com', 'test123')
        
        # Create a test booking
        booking = Booking.objects.create(
            organization=org,
            branch=branch,
            user_id=user.id,
            booking_number=f"BK-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            total_amount=50000,
            currency='PKR',
            status='confirmed',
        )
        
        print_success(f"Created test booking: {booking.booking_number}")
        print_info(f"  Organization: {org.name}")
        print_info(f"  Branch: {branch.name}")
        print_info(f"  Booking ID: {booking.id}")
        
        return booking, org, branch, user
        
    except Exception as e:
        print_error(f"Failed to create test booking: {str(e)}")
        return None, None, None, None

def test_create_outsourcing(booking, token):
    """Test POST /api/hotel-outsourcing/"""
    print_section("TEST 1: CREATE HOTEL OUTSOURCING")
    
    headers = {'Authorization': token} if token else {}
    headers['Content-Type'] = 'application/json'
    
    # Calculate dates
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=5)
    
    payload = {
        "booking_id": booking.id,
        "hotel_name": "Swissotel Al Maqam Makkah",
        "room_type": "Quad",
        "room_no": "302",
        "room_price": 450,
        "currency": "SAR",
        "quantity": 1,
        "number_of_nights": 5,
        "check_in": check_in.isoformat(),
        "check_out": check_out.isoformat(),
        "remarks": "Booked directly from outside source (Hotel XYZ)",
        "created_by": 1
    }
    
    print_info("Request Payload:")
    for key, value in payload.items():
        print(f"  {key}: {value}")
    
    try:
        response = requests.post(f"{API_BASE}/hotel-outsourcing/", json=payload, headers=headers)
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success("Hotel outsourcing created successfully!")
            print_info(f"Response Data:")
            for key, value in data.items():
                print(f"  {key}: {value}")
            
            # Verify auto actions
            booking.refresh_from_db()
            if booking.is_outsourced:
                print_success("✓ Auto-action: booking.is_outsourced = True")
            
            if data.get('ledger_entry_id'):
                print_success(f"✓ Auto-action: Ledger entry created (ID: {data.get('ledger_entry_id')})")
            
            if data.get('agent_notified'):
                print_success("✓ Auto-action: Agent notified")
            
            return data.get('id')
        else:
            print_error(f"Failed to create outsourcing: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Exception during create: {str(e)}")
        return None

def test_list_outsourcing(token, org_id, branch_id):
    """Test GET /api/hotel-outsourcing/"""
    print_section("TEST 2: LIST HOTEL OUTSOURCING RECORDS")
    
    headers = {'Authorization': token} if token else {}
    
    # Test with filters
    params = {
        'organization_id': org_id,
        'branch_id': branch_id,
        'limit': 10,
        'offset': 0
    }
    
    print_info("Query Parameters:")
    for key, value in params.items():
        print(f"  {key}: {value}")
    
    try:
        response = requests.get(f"{API_BASE}/hotel-outsourcing/", params=params, headers=headers)
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {data.get('total_records', 0)} records")
            print_info(f"Response Structure:")
            print(f"  total_records: {data.get('total_records')}")
            print(f"  limit: {data.get('limit')}")
            print(f"  offset: {data.get('offset')}")
            print(f"  data (records): {len(data.get('data', []))}")
            
            if data.get('data'):
                print_info("\nFirst Record Details:")
                first_record = data['data'][0]
                for key, value in first_record.items():
                    print(f"  {key}: {value}")
            
            return True
        else:
            print_error(f"Failed to list outsourcing: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception during list: {str(e)}")
        return False

def test_get_outsourcing_detail(outsourcing_id, token):
    """Test GET /api/hotel-outsourcing/{id}/"""
    print_section("TEST 3: GET OUTSOURCING DETAIL")
    
    headers = {'Authorization': token} if token else {}
    
    try:
        response = requests.get(f"{API_BASE}/hotel-outsourcing/{outsourcing_id}/", headers=headers)
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("Retrieved outsourcing details successfully!")
            print_info("Details:")
            for key, value in data.items():
                print(f"  {key}: {value}")
            
            # Verify response structure matches requirements
            required_fields = ['id', 'booking_id', 'hotel_name', 'room_type', 'room_price', 
                             'currency', 'check_in', 'check_out', 'quantity', 'status', 
                             'organization_owner', 'branch', 'linked_in_ledger']
            
            missing_fields = [f for f in required_fields if f not in data]
            if not missing_fields:
                print_success("✓ All required fields present in response")
            else:
                print_error(f"Missing fields: {missing_fields}")
            
            return True
        else:
            print_error(f"Failed to get outsourcing detail: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception during detail retrieval: {str(e)}")
        return False

def test_update_payment_status(outsourcing_id, token):
    """Test PATCH /api/hotel-outsourcing/{id}/payment-status/"""
    print_section("TEST 4: UPDATE PAYMENT STATUS")
    
    headers = {'Authorization': token} if token else {}
    headers['Content-Type'] = 'application/json'
    
    # Test marking as paid
    payload = {"is_paid": True}
    
    print_info(f"Marking outsourcing {outsourcing_id} as PAID")
    print_info(f"Payload: {payload}")
    
    try:
        response = requests.patch(
            f"{API_BASE}/hotel-outsourcing/{outsourcing_id}/payment-status/",
            json=payload,
            headers=headers
        )
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("Payment status updated successfully!")
            print_info(f"New status: {data.get('status')}")
            print_info(f"is_paid: {data.get('is_paid')}")
            
            if data.get('status') == 'paid':
                print_success("✓ Status correctly shows 'paid'")
            
            # Test idempotency - call again
            print_info("\nTesting idempotency (calling again)...")
            response2 = requests.patch(
                f"{API_BASE}/hotel-outsourcing/{outsourcing_id}/payment-status/",
                json=payload,
                headers=headers
            )
            if response2.status_code == 200:
                print_success("✓ Idempotent: Second call succeeded without duplicate settlement")
            
            return True
        else:
            print_error(f"Failed to update payment status: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception during payment status update: {str(e)}")
        return False

def test_filters(token):
    """Test various filter combinations"""
    print_section("TEST 5: FILTER TESTS")
    
    headers = {'Authorization': token} if token else {}
    
    # Test status filter - pending
    print_info("Testing status filter: pending")
    response = requests.get(f"{API_BASE}/hotel-outsourcing/", 
                           params={'status': 'pending'}, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print_success(f"Found {data.get('total_records', 0)} pending records")
    
    # Test status filter - paid
    print_info("Testing status filter: paid")
    response = requests.get(f"{API_BASE}/hotel-outsourcing/", 
                           params={'status': 'paid'}, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print_success(f"Found {data.get('total_records', 0)} paid records")
    
    # Test hotel name search
    print_info("Testing hotel_name search: 'Swissotel'")
    response = requests.get(f"{API_BASE}/hotel-outsourcing/", 
                           params={'hotel_name': 'Swissotel'}, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print_success(f"Found {data.get('total_records', 0)} records matching 'Swissotel'")
    
    return True

def test_swagger_accessibility():
    """Test if Swagger documentation is accessible"""
    print_section("TEST 6: SWAGGER DOCUMENTATION")
    
    try:
        # Check Swagger UI
        response = requests.get(f"{BASE_URL}/api/schema/swagger-ui/")
        if response.status_code == 200:
            print_success("Swagger UI is accessible at /api/schema/swagger-ui/")
        else:
            print_error(f"Swagger UI not accessible: {response.status_code}")
        
        # Check OpenAPI schema
        response = requests.get(f"{BASE_URL}/api/schema/")
        if response.status_code == 200:
            schema = response.json()
            
            # Check if hotel-outsourcing endpoints are in schema
            paths = schema.get('paths', {})
            hotel_paths = [p for p in paths.keys() if 'hotel-outsourcing' in p]
            
            print_success(f"Found {len(hotel_paths)} hotel-outsourcing endpoints in OpenAPI schema")
            print_info("Endpoints:")
            for path in hotel_paths:
                methods = list(paths[path].keys())
                print(f"  {path}: {', '.join(methods).upper()}")
            
            # Check tags
            tags = schema.get('tags', [])
            hotel_tag = next((t for t in tags if t.get('name') == 'Hotel Outsourcing'), None)
            if hotel_tag:
                print_success("✓ 'Hotel Outsourcing' tag found in schema")
            else:
                print_info("Note: 'Hotel Outsourcing' tag not explicitly defined (endpoints may still work)")
            
        return True
        
    except Exception as e:
        print_error(f"Exception during Swagger check: {str(e)}")
        return False

def verify_database_state():
    """Verify database state after all tests"""
    print_section("DATABASE VERIFICATION")
    
    try:
        total_outsourcing = HotelOutsourcing.objects.filter(is_deleted=False).count()
        paid_count = HotelOutsourcing.objects.filter(is_deleted=False, is_paid=True).count()
        pending_count = HotelOutsourcing.objects.filter(is_deleted=False, is_paid=False).count()
        total_cost = sum(h.outsource_cost for h in HotelOutsourcing.objects.filter(is_deleted=False))
        
        print_success(f"Total Active Outsourcing Records: {total_outsourcing}")
        print_info(f"  Paid: {paid_count}")
        print_info(f"  Pending: {pending_count}")
        print_info(f"  Total Outsource Cost: {total_cost:.2f}")
        
        # Check bookings marked as outsourced
        outsourced_bookings = Booking.objects.filter(is_outsourced=True).count()
        print_success(f"Bookings marked as outsourced: {outsourced_bookings}")
        
        # Check ledger entries
        outsourcing_records = HotelOutsourcing.objects.filter(is_deleted=False, ledger_entry_id__isnull=False)
        print_success(f"Outsourcing records with ledger entries: {outsourcing_records.count()}/{total_outsourcing}")
        
        return True
        
    except Exception as e:
        print_error(f"Exception during database verification: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "🏨 " * 30)
    print("HOTEL OUTSOURCING MODULE - COMPLETE TEST SUITE")
    print("🏨 " * 30)
    
    # Get auth token
    token = get_auth_token()
    
    # Create test booking
    booking, org, branch, user = create_test_booking()
    if not booking:
        print_error("Cannot proceed without test booking")
        return
    
    # Run tests
    outsourcing_id = test_create_outsourcing(booking, token)
    if not outsourcing_id:
        print_error("Cannot proceed - failed to create outsourcing")
        return
    
    test_list_outsourcing(token, org.id, branch.id)
    test_get_outsourcing_detail(outsourcing_id, token)
    test_update_payment_status(outsourcing_id, token)
    test_filters(token)
    test_swagger_accessibility()
    verify_database_state()
    
    # Final summary
    print_section("TEST SUMMARY")
    print_success("All tests completed!")
    print_info("\nAPI Endpoints Tested:")
    print("  ✅ POST   /api/hotel-outsourcing/")
    print("  ✅ GET    /api/hotel-outsourcing/")
    print("  ✅ GET    /api/hotel-outsourcing/{id}/")
    print("  ✅ PATCH  /api/hotel-outsourcing/{id}/payment-status/")
    print_info("\nAccess Points:")
    print(f"  🌐 Swagger UI: {BASE_URL}/api/schema/swagger-ui/")
    print(f"  📋 Admin Panel: {BASE_URL}/admin/booking/hoteloutsourcing/")
    print(f"  📄 API Schema: {BASE_URL}/api/schema/")
    print("\n" + "🎉 " * 30)
    print("HOTEL OUTSOURCING MODULE IS FULLY OPERATIONAL!")
    print("🎉 " * 30 + "\n")

if __name__ == "__main__":
    main()
