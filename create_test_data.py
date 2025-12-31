"""
Create Comprehensive Test Data for Pax Movement Tracking
Adds realistic bookings covering all passenger statuses
"""

import pymysql
from datetime import datetime, timedelta

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'root',
    'database': 'saerpk_local',
    'charset': 'utf8mb4',
    'port': 3306
}

def create_test_data():
    """Create test bookings with various passenger statuses"""
    
    print("\n" + "=" * 70)
    print("CREATING TEST DATA FOR PAX MOVEMENT TRACKING")
    print("=" * 70 + "\n")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("✅ Connected to database\n")
        
        # Get organization and agency info
        cursor.execute("SELECT id FROM organization_organization WHERE id = 11")
        org_result = cursor.fetchone()
        if not org_result:
            print("❌ Organization 11 not found!")
            return False
        
        # Get any agency (we'll use the first one available)
        cursor.execute("SELECT id FROM organization_agency LIMIT 1")
        agency_result = cursor.fetchone()
        if not agency_result:
            print("❌ No agency found!")
            return False
        
        org_id = 11
        agency_id = agency_result[0]
        
        print(f"📋 Using Organization ID: {org_id}")
        print(f"📋 Using Agency ID: {agency_id}\n")
        
        now = datetime.now()
        test_bookings = []
        
        # Test Case 1: In Pakistan (Future Departure - 5 days)
        print("Creating Test Case 1: IN PAKISTAN (Future Departure)...")
        booking1 = create_booking(
            cursor, org_id, agency_id,
            booking_number=f"TEST-PAK-{now.strftime('%m%d%H%M')}",
            passengers=[
                {"first_name": "Ahmed", "last_name": "Khan", "passport": "AB1234567"},
                {"first_name": "Fatima", "last_name": "Khan", "passport": "AB1234568"}
            ],
            departure_date=now + timedelta(days=5),
            return_date=now + timedelta(days=20)
        )
        test_bookings.append(("In Pakistan", 2))
        
        # Test Case 2: In Flight (Currently Flying)
        print("Creating Test Case 2: IN FLIGHT (Currently Flying)...")
        booking2 = create_booking(
            cursor, org_id, agency_id,
            booking_number=f"TEST-FLT-{now.strftime('%m%d%H%M')}",
            passengers=[
                {"first_name": "Usman", "last_name": "Ali", "passport": "CD7654321"}
            ],
            departure_date=now - timedelta(hours=2),
            arrival_date=now + timedelta(hours=4),
            return_date=now + timedelta(days=15)
        )
        test_bookings.append(("In Flight", 1))
        
        # Test Case 3: In Makkah (Arrived 3 days ago)
        print("Creating Test Case 3: IN MAKKAH...")
        booking3 = create_booking(
            cursor, org_id, agency_id,
            booking_number=f"TEST-MKH-{now.strftime('%m%d%H%M')}",
            passengers=[
                {"first_name": "Hassan", "last_name": "Raza", "passport": "EF9876543"},
                {"first_name": "Ayesha", "last_name": "Raza", "passport": "EF9876544"},
                {"first_name": "Ali", "last_name": "Raza", "passport": "EF9876545"}
            ],
            departure_date=now - timedelta(days=3),
            return_date=now + timedelta(days=12),
            transport_to="Makkah"
        )
        test_bookings.append(("In Makkah", 3))
        
        # Test Case 4: In Madina (Arrived 5 days ago)
        print("Creating Test Case 4: IN MADINA...")
        booking4 = create_booking(
            cursor, org_id, agency_id,
            booking_number=f"TEST-MDN-{now.strftime('%m%d%H%M')}",
            passengers=[
                {"first_name": "Bilal", "last_name": "Ahmed", "passport": "GH1122334"},
                {"first_name": "Zainab", "last_name": "Ahmed", "passport": "GH1122335"}
            ],
            departure_date=now - timedelta(days=5),
            return_date=now + timedelta(days=10),
            transport_to="Madina"
        )
        test_bookings.append(("In Madina", 2))
        
        # Test Case 5: In Jeddah (Arrived 1 day ago)
        print("Creating Test Case 5: IN JEDDAH...")
        booking5 = create_booking(
            cursor, org_id, agency_id,
            booking_number=f"TEST-JED-{now.strftime('%m%d%H%M')}",
            passengers=[
                {"first_name": "Imran", "last_name": "Malik", "passport": "IJ5566778"}
            ],
            departure_date=now - timedelta(days=1),
            return_date=now + timedelta(days=7),
            transport_to="Jeddah"
        )
        test_bookings.append(("In Jeddah", 1))
        
        # Test Case 6: Exit Pending (Return in 2 days)
        print("Creating Test Case 6: EXIT PENDING...")
        booking6 = create_booking(
            cursor, org_id, agency_id,
            booking_number=f"TEST-EXP-{now.strftime('%m%d%H%M')}",
            passengers=[
                {"first_name": "Tariq", "last_name": "Hussain", "passport": "KL9988776"},
                {"first_name": "Nadia", "last_name": "Hussain", "passport": "KL9988777"}
            ],
            departure_date=now - timedelta(days=13),
            return_date=now + timedelta(days=2),
            transport_to="Makkah"
        )
        test_bookings.append(("Exit Pending", 2))
        
        # Test Case 7: Exited KSA (Returned 2 days ago)
        print("Creating Test Case 7: EXITED KSA...")
        booking7 = create_booking(
            cursor, org_id, agency_id,
            booking_number=f"TEST-EXT-{now.strftime('%m%d%H%M')}",
            passengers=[
                {"first_name": "Rashid", "last_name": "Mahmood", "passport": "MN4455667"},
                {"first_name": "Sana", "last_name": "Mahmood", "passport": "MN4455668"},
                {"first_name": "Omar", "last_name": "Mahmood", "passport": "MN4455669"},
                {"first_name": "Maryam", "last_name": "Mahmood", "passport": "MN4455670"}
            ],
            departure_date=now - timedelta(days=20),
            return_date=now - timedelta(days=2),
            transport_to="Makkah"
        )
        test_bookings.append(("Exited KSA", 4))
        
        connection.commit()
        
        print("\n" + "=" * 70)
        print("✅ TEST DATA CREATED SUCCESSFULLY!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        total_passengers = sum(count for _, count in test_bookings)
        print(f"   Total Bookings Created: {len(test_bookings)}")
        print(f"   Total Passengers: {total_passengers}")
        print(f"\n🎯 Expected Status Distribution:")
        for status, count in test_bookings:
            print(f"   {status}: {count} passengers")
        
        print(f"\n🚀 Next Steps:")
        print(f"   1. Refresh the Pax Movement Tracking page")
        print(f"   2. You should see all {total_passengers} passengers")
        print(f"   3. Check each status category")
        print(f"   4. Verify the statistics cards")
        print(f"   5. Test search and filter functionality")
        print("\n" + "=" * 70 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        if 'connection' in locals() and connection.open:
            cursor.close()
            connection.close()
            print("🔒 Database connection closed\n")

def create_booking(cursor, org_id, agency_id, booking_number, passengers, 
                   departure_date, return_date, arrival_date=None, transport_to="Makkah"):
    """Create a booking with passengers"""
    
    now = datetime.now()
    
    # Create booking
    booking_query = """
        INSERT INTO booking_booking (
            booking_number, status, organization_id, agency_id,
            total_pax, total_adult, total_child, total_infant,
            date, created_at, booking_type, is_full_package
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    cursor.execute(booking_query, (
        booking_number, 'Approved', org_id, agency_id,
        len(passengers), len(passengers), 0, 0,
        now, now, 'UMRAH', 1
    ))
    
    booking_id = cursor.lastrowid
    
    # Create passengers
    for passenger in passengers:
        person_query = """
            INSERT INTO booking_bookingpersondetail (
                booking_id, first_name, last_name, passport_number,
                visa_status, age_group, date_of_birth
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(person_query, (
            booking_id,
            passenger['first_name'],
            passenger['last_name'],
            passenger['passport'],
            'Approved',  # All test passengers have approved visas
            'Adult',
            '1990-01-01'
        ))
    
    # Create ticket details (simplified - stored as related records if needed)
    # For now, we'll add them to a tickets table if it exists
    try:
        ticket_query = """
            INSERT INTO booking_bookingticketdetails (
                booking_id, flight_number, departure_airport, arrival_airport,
                departure_date, departure_time, arrival_date, arrival_time,
                return_date, return_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        arr_date = arrival_date if arrival_date else departure_date
        
        cursor.execute(ticket_query, (
            booking_id,
            'PK-740',
            'Islamabad (ISB)',
            'Jeddah (JED)',
            departure_date.strftime('%Y-%m-%d'),
            departure_date.strftime('%H:%M'),
            arr_date.strftime('%Y-%m-%d'),
            arr_date.strftime('%H:%M'),
            return_date.strftime('%Y-%m-%d'),
            '23:00'
        ))
    except:
        # Table might not exist, skip
        pass
    
    # Create transport details
    try:
        transport_query = """
            INSERT INTO booking_bookingtransportdetails (
                booking_id, departure_city, arrival_city, vehicle_type
            ) VALUES (%s, %s, %s, %s)
        """
        
        cursor.execute(transport_query, (
            booking_id,
            'Jeddah',
            transport_to,
            'Coaster'
        ))
    except:
        # Table might not exist, skip
        pass
    
    print(f"   ✓ Created booking: {booking_number} with {len(passengers)} passengers")
    
    return booking_id

if __name__ == "__main__":
    success = create_test_data()
    
    if success:
        print("✅ All test data created successfully!")
        print("🚀 Refresh the Pax Movement Tracking page now!\n")
    else:
        print("\n❌ Failed to create test data. Check errors above.")
