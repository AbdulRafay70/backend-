"""
Create Test Data Using Django ORM
Based on existing booking structure
"""

import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from booking.models import Booking, BookingPersonDetail, BookingTicketDetails, BookingTransportDetails
from organization.models import Organization, Agency

def create_test_data():
    """Create comprehensive test data for Pax Movement Tracking"""
    
    print("\n" + "=" * 70)
    print("CREATING TEST DATA FOR PAX MOVEMENT TRACKING")
    print("=" * 70 + "\n")
    
    try:
        # Get organization and agency from existing booking
        existing_booking = Booking.objects.filter(organization_id=11, status='Approved').first()
        
        if not existing_booking:
            print("❌ No existing approved booking found for org 11")
            return False
        
        org = existing_booking.organization
        agency = existing_booking.agency
        user_id = existing_booking.user_id if hasattr(existing_booking, 'user_id') else None
        branch_id = existing_booking.branch_id if hasattr(existing_booking, 'branch_id') else None
        
        print(f"✅ Using Organization: {org.name if hasattr(org, 'name') else org.id}")
        print(f"✅ Using Agency: {agency.ageny_name if agency else 'N/A'}")
        print(f"✅ Using User ID: {user_id}")
        print(f"✅ Using Branch ID: {branch_id}")
        print(f"✅ Using existing booking as template\n")
        
        now = datetime.now()
        test_bookings_created = []
        
        # Test Case 1: In Pakistan (Future Departure - 5 days)
        print("Creating Test Case 1: IN PAKISTAN (Future Departure)...")
        booking1 = Booking.objects.create(
            organization=org,
            agency=agency,
            user_id=user_id,
            branch_id=branch_id,
            booking_number=f"TEST-PAK-{now.strftime('%m%d%H%M')}",
            status='Approved',
            total_pax=2,
            total_adult=2,
            total_child=0,
            total_infant=0,
            total_amount=100000.0,
            booking_type='UMRAH',
            is_full_package=True,
            date=now,
            created_at=now
        )
        
        # Add passengers
        BookingPersonDetail.objects.create(
            booking=booking1,
            first_name="Ahmed",
            last_name="Khan",
            passport_number="AB1234567",
            visa_status="Approved",
            age_group="Adult",
            date_of_birth="1990-01-15"
        )
        BookingPersonDetail.objects.create(
            booking=booking1,
            first_name="Fatima",
            last_name="Khan",
            passport_number="AB1234568",
            visa_status="Approved",
            age_group="Adult",
            date_of_birth="1992-03-20"
        )
        
        # Add ticket
        BookingTicketDetails.objects.create(
            booking=booking1,
            flight_number="PK-740",
            departure_airport="Islamabad (ISB)",
            arrival_airport="Jeddah (JED)",
            departure_date=(now + timedelta(days=5)).date(),
            departure_time="03:00",
            arrival_date=(now + timedelta(days=5)).date(),
            arrival_time="09:00",
            return_date=(now + timedelta(days=20)).date(),
            return_time="23:00"
        )
        
        # Add transport
        BookingTransportDetails.objects.create(
            booking=booking1,
            departure_city="Jeddah",
            arrival_city="Makkah",
            vehicle_type="Coaster"
        )
        
        test_bookings_created.append(("In Pakistan", 2, booking1.booking_number))
        print(f"   ✓ Created: {booking1.booking_number}\n")
        
        # Test Case 2: In Flight (Currently Flying)
        print("Creating Test Case 2: IN FLIGHT (Currently Flying)...")
        booking2 = Booking.objects.create(
            organization=org,
            agency=agency,
            user_id=user_id,
            branch_id=branch_id,
            booking_number=f"TEST-FLT-{now.strftime('%m%d%H%M')}",
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
        
        BookingPersonDetail.objects.create(
            booking=booking2,
            first_name="Usman",
            last_name="Ali",
            passport_number="CD7654321",
            visa_status="Approved",
            age_group="Adult",
            date_of_birth="1988-05-10"
        )
        
        flight_dep = now - timedelta(hours=2)
        flight_arr = now + timedelta(hours=4)
        
        BookingTicketDetails.objects.create(
            booking=booking2,
            flight_number="SV-722",
            departure_airport="Karachi (KHI)",
            arrival_airport="Jeddah (JED)",
            departure_date=flight_dep.date(),
            departure_time=flight_dep.strftime("%H:%M"),
            arrival_date=flight_arr.date(),
            arrival_time=flight_arr.strftime("%H:%M"),
            return_date=(now + timedelta(days=15)).date(),
            return_time="22:00"
        )
        
        BookingTransportDetails.objects.create(
            booking=booking2,
            departure_city="Jeddah",
            arrival_city="Madina",
            vehicle_type="Coaster"
        )
        
        test_bookings_created.append(("In Flight", 1, booking2.booking_number))
        print(f"   ✓ Created: {booking2.booking_number}\n")
        
        # Test Case 3: In Makkah (Arrived 3 days ago)
        print("Creating Test Case 3: IN MAKKAH...")
        booking3 = Booking.objects.create(
            organization=org,
            agency=agency,
            user_id=user_id,
            branch_id=branch_id,
            booking_number=f"TEST-MKH-{now.strftime('%m%d%H%M')}",
            status='Approved',
            total_pax=3,
            total_adult=3,
            total_child=0,
            total_infant=0,
            total_amount=150000.0,
            booking_type='UMRAH',
            is_full_package=True,
            date=now,
            created_at=now
        )
        
        for first_name, last_name, passport in [
            ("Hassan", "Raza", "EF9876543"),
            ("Ayesha", "Raza", "EF9876544"),
            ("Ali", "Raza", "EF9876545")
        ]:
            BookingPersonDetail.objects.create(
                booking=booking3,
                first_name=first_name,
                last_name=last_name,
                passport_number=passport,
                visa_status="Approved",
                age_group="Adult",
                date_of_birth="1985-07-22"
            )
        
        arrived_date = now - timedelta(days=3)
        BookingTicketDetails.objects.create(
            booking=booking3,
            flight_number="PK-750",
            departure_airport="Lahore (LHE)",
            arrival_airport="Jeddah (JED)",
            departure_date=arrived_date.date(),
            departure_time="04:00",
            arrival_date=arrived_date.date(),
            arrival_time="10:00",
            return_date=(now + timedelta(days=12)).date(),
            return_time="23:30"
        )
        
        BookingTransportDetails.objects.create(
            booking=booking3,
            departure_city="Jeddah",
            arrival_city="Makkah",
            vehicle_type="Coaster"
        )
        
        test_bookings_created.append(("In Makkah", 3, booking3.booking_number))
        print(f"   ✓ Created: {booking3.booking_number}\n")
        
        # Test Case 4: In Madina
        print("Creating Test Case 4: IN MADINA...")
        booking4 = Booking.objects.create(
            organization=org,
            agency=agency,
            user_id=user_id,
            branch_id=branch_id,
            booking_number=f"TEST-MDN-{now.strftime('%m%d%H%M')}",
            status='Approved',
            total_pax=2,
            total_adult=2,
            total_child=0,
            total_infant=0,
            total_amount=100000.0,
            booking_type='UMRAH',
            is_full_package=True,
            date=now,
            created_at=now
        )
        
        for first_name, last_name, passport in [
            ("Bilal", "Ahmed", "GH1122334"),
            ("Zainab", "Ahmed", "GH1122335")
        ]:
            BookingPersonDetail.objects.create(
                booking=booking4,
                first_name=first_name,
                last_name=last_name,
                passport_number=passport,
                visa_status="Approved",
                age_group="Adult",
                date_of_birth="1980-11-05"
            )
        
        arrived_date = now - timedelta(days=5)
        BookingTicketDetails.objects.create(
            booking=booking4,
            flight_number="SV-724",
            departure_airport="Multan (MUX)",
            arrival_airport="Jeddah (JED)",
            departure_date=arrived_date.date(),
            departure_time="05:00",
            arrival_date=arrived_date.date(),
            arrival_time="11:00",
            return_date=(now + timedelta(days=10)).date(),
            return_time="22:00"
        )
        
        BookingTransportDetails.objects.create(
            booking=booking4,
            departure_city="Jeddah",
            arrival_city="Madina",
            vehicle_type="Coaster"
        )
        
        test_bookings_created.append(("In Madina", 2, booking4.booking_number))
        print(f"   ✓ Created: {booking4.booking_number}\n")
        
        # Test Case 5: Exit Pending
        print("Creating Test Case 5: EXIT PENDING...")
        booking5 = Booking.objects.create(
            organization=org,
            agency=agency,
            user_id=user_id,
            branch_id=branch_id,
            booking_number=f"TEST-EXP-{now.strftime('%m%d%H%M')}",
            status='Approved',
            total_pax=2,
            total_adult=2,
            total_child=0,
            total_infant=0,
            total_amount=100000.0,
            booking_type='UMRAH',
            is_full_package=True,
            date=now,
            created_at=now
        )
        
        for first_name, last_name, passport in [
            ("Tariq", "Hussain", "KL9988776"),
            ("Nadia", "Hussain", "KL9988777")
        ]:
            BookingPersonDetail.objects.create(
                booking=booking5,
                first_name=first_name,
                last_name=last_name,
                passport_number=passport,
                visa_status="Approved",
                age_group="Adult",
                date_of_birth="1978-08-12"
            )
        
        arrived_date = now - timedelta(days=13)
        BookingTicketDetails.objects.create(
            booking=booking5,
            flight_number="SV-730",
            departure_airport="Peshawar (PEW)",
            arrival_airport="Jeddah (JED)",
            departure_date=arrived_date.date(),
            departure_time="06:00",
            arrival_date=arrived_date.date(),
            arrival_time="12:00",
            return_date=(now + timedelta(days=2)).date(),
            return_time="20:00"
        )
        
        BookingTransportDetails.objects.create(
            booking=booking5,
            departure_city="Jeddah",
            arrival_city="Makkah",
            vehicle_type="Coaster"
        )
        
        test_bookings_created.append(("Exit Pending", 2, booking5.booking_number))
        print(f"   ✓ Created: {booking5.booking_number}\n")
        
        # Test Case 6: Exited KSA
        print("Creating Test Case 6: EXITED KSA...")
        booking6 = Booking.objects.create(
            organization=org,
            agency=agency,
            user_id=user_id,
            branch_id=branch_id,
            booking_number=f"TEST-EXT-{now.strftime('%m%d%H%M')}",
            status='Approved',
            total_pax=2,
            total_adult=2,
            total_child=0,
            total_infant=0,
            total_amount=100000.0,
            booking_type='UMRAH',
            is_full_package=True,
            date=now,
            created_at=now
        )
        
        for first_name, last_name, passport in [
            ("Rashid", "Mahmood", "MN4455667"),
            ("Sana", "Mahmood", "MN4455668")
        ]:
            BookingPersonDetail.objects.create(
                booking=booking6,
                first_name=first_name,
                last_name=last_name,
                passport_number=passport,
                visa_status="Approved",
                age_group="Adult",
                date_of_birth="1983-06-18"
            )
        
        arrived_date = now - timedelta(days=20)
        return_date = now - timedelta(days=2)
        
        BookingTicketDetails.objects.create(
            booking=booking6,
            flight_number="PK-770",
            departure_airport="Sialkot (SKT)",
            arrival_airport="Jeddah (JED)",
            departure_date=arrived_date.date(),
            departure_time="03:30",
            arrival_date=arrived_date.date(),
            arrival_time="09:30",
            return_date=return_date.date(),
            return_time="23:00"
        )
        
        BookingTransportDetails.objects.create(
            booking=booking6,
            departure_city="Jeddah",
            arrival_city="Makkah",
            vehicle_type="Coaster"
        )
        
        test_bookings_created.append(("Exited KSA", 2, booking6.booking_number))
        print(f"   ✓ Created: {booking6.booking_number}\n")
        
        print("=" * 70)
        print("✅ TEST DATA CREATED SUCCESSFULLY!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        total_passengers = sum(count for _, count, _ in test_bookings_created)
        print(f"   Total Bookings Created: {len(test_bookings_created)}")
        print(f"   Total Passengers: {total_passengers}")
        print(f"\n🎯 Expected Status Distribution:")
        for status, count, booking_num in test_bookings_created:
            print(f"   {status}: {count} passengers ({booking_num})")
        
        print(f"\n🚀 Next Steps:")
        print(f"   1. Refresh the Pax Movement Tracking page")
        print(f"   2. You should see {total_passengers + 2} total passengers (including existing)")
        print(f"   3. Verify each status category works correctly")
        print(f"   4. Test search and filter functionality")
        print(f"   5. Check statistics cards")
        print("\n" + "=" * 70 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = create_test_data()
    
    if success:
        print("✅ All test data created successfully!")
        print("🚀 Refresh the Pax Movement Tracking page now!\n")
    else:
        print("\n❌ Failed to create test data. Check errors above.")
