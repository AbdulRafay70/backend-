"""
Simple Test Data Creator - Just Bookings and Passengers
No ticket/transport details to avoid field name issues
"""

import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from booking.models import Booking, BookingPersonDetail
from organization.models import Organization, Agency

def create_simple_test_data():
    """Create simple test bookings with just passengers"""
    
    print("\n" + "=" * 70)
    print("CREATING SIMPLE TEST DATA FOR PAX MOVEMENT TRACKING")
    print("=" * 70 + "\n")
    
    try:
        # Get existing booking as template
        existing_booking = Booking.objects.filter(organization_id=11, status='Approved').first()
        
        if not existing_booking:
            print("❌ No existing approved booking found for org 11")
            return False
        
        org = existing_booking.organization
        agency = existing_booking.agency
        user_id = existing_booking.user_id if hasattr(existing_booking, 'user_id') else None
        branch_id = existing_booking.branch_id if hasattr(existing_booking, 'branch_id') else None
        
        print(f"✅ Using Organization: {org.id}")
        print(f"✅ Using Agency: {agency.id if agency else 'N/A'}")
        print(f"✅ Using User ID: {user_id}")
        print(f"✅ Using Branch ID: {branch_id}\n")
        
        now = datetime.now()
        created_count = 0
        
        # Test passengers with different names
        test_passengers = [
            ("Zain", "Abbas", "ZA111111"),
            ("Sara", "Ahmed", "SA222222"),
            ("Hamza", "Khan", "HK333333"),
            ("Aisha", "Malik", "AM444444"),
            ("Omar", "Hassan", "OH555555"),
        ]
        
        print("Creating test bookings with passengers...\n")
        
        for first_name, last_name, passport in test_passengers:
            try:
                # Create booking
                booking = Booking.objects.create(
                    organization=org,
                    agency=agency,
                    user_id=user_id,
                    branch_id=branch_id,
                    booking_number=f"TEST-{passport[-4:]}-{now.strftime('%H%M')}",
                    status='Approved',
                    total_pax=1,
                    total_adult=1,
                    total_child=0,
                    total_infant=0,
                    total_amount=50000.0,
                    booking_type='UMRAH',
                    is_full_package=True,
                    date=now,
                    created_at=now
                )
                
                # Create passenger
                BookingPersonDetail.objects.create(
                    booking=booking,
                    first_name=first_name,
                    last_name=last_name,
                    passport_number=passport,
                    visa_status="Approved",
                    age_group="Adult",
                    date_of_birth="1990-01-01"
                )
                
                created_count += 1
                print(f"   ✓ Created: {booking.booking_number} - {first_name} {last_name}")
                
            except Exception as e:
                print(f"   ❌ Error creating booking for {first_name} {last_name}: {e}")
                continue
        
        print("\n" + "=" * 70)
        print("✅ TEST DATA CREATED!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        print(f"   Bookings Created: {created_count}")
        print(f"   Passengers Created: {created_count}")
        
        print(f"\n⚠️  NOTE:")
        print(f"   These bookings don't have ticket/transport details yet.")
        print(f"   Add flight dates and transport manually through Django admin")
        print(f"   or your booking system to test different statuses.")
        
        print(f"\n🚀 Next Steps:")
        print(f"   1. Go to Django Admin")
        print(f"   2. Find the TEST-XXXX bookings")
        print(f"   3. Add ticket details with different dates:")
        print(f"      - Future departure = In Pakistan")
        print(f"      - Past departure = In KSA (based on transport)")
        print(f"      - Return in 2 days = Exit Pending")
        print(f"      - Past return = Exited KSA")
        print(f"   4. Add transport details (arrival_city: Makkah/Madina/Jeddah)")
        print(f"   5. Refresh Pax Movement Tracking page")
        print("\n" + "=" * 70 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = create_simple_test_data()
    
    if success:
        print("✅ Test bookings created!")
        print("Add ticket/transport details manually to test different statuses.\n")
    else:
        print("\n❌ Failed to create test data.")
