"""
Update Visa Statuses to Approved - Local Database
Uses local MySQL credentials
"""

import pymysql
import json

# Local database credentials
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'root',
    'database': 'saerpk_local',
    'charset': 'utf8mb4',
    'port': 3306
}

def update_visa_statuses():
    """Update all passengers in approved bookings to have visa_status = 'Approved'"""
    
    print("\n" + "=" * 70)
    print("PAX MOVEMENT TRACKING - VISA STATUS UPDATE")
    print("=" * 70 + "\n")
    
    print("🔧 Connecting to local database...")
    
    try:
        # Connect to database
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("✅ Connected to saerpk_local successfully!\n")
        
        # Get all approved bookings for org 11
        cursor.execute("""
            SELECT id, booking_number, person_details 
            FROM booking_booking 
            WHERE status = 'Approved' AND organization_id = 11
        """)
        
        bookings = cursor.fetchall()
        total_bookings = len(bookings)
        total_passengers_updated = 0
        total_passengers = 0
        
        print(f"📦 Found {total_bookings} approved bookings for Organization 11\n")
        print("=" * 70)
        print("Updating Passengers...")
        print("=" * 70 + "\n")
        
        for booking_id, booking_number, person_details_json in bookings:
            try:
                # Parse JSON
                person_details = json.loads(person_details_json)
                passengers_in_booking = len(person_details)
                total_passengers += passengers_in_booking
                updated_count = 0
                
                print(f"📋 Booking: {booking_number}")
                
                # Update each passenger's visa_status
                for i, person in enumerate(person_details):
                    old_status = person.get('visa_status', 'None')
                    person_name = f"{person.get('first_name', '')} {person.get('last_name', '')}"
                    
                    if old_status != 'Approved':
                        person['visa_status'] = 'Approved'
                        updated_count += 1
                        print(f"   ✓ Passenger {i+1}: {person_name}")
                        print(f"      Status: {old_status} → Approved")
                    else:
                        print(f"   ✓ Passenger {i+1}: {person_name} (already Approved)")
                
                # Update the booking
                updated_json = json.dumps(person_details, ensure_ascii=False)
                cursor.execute("""
                    UPDATE booking_booking 
                    SET person_details = %s 
                    WHERE id = %s
                """, (updated_json, booking_id))
                
                total_passengers_updated += updated_count
                
                if updated_count > 0:
                    print(f"   📊 Updated {updated_count}/{passengers_in_booking} passengers")
                print()
                
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing JSON for booking {booking_number}: {e}\n")
                continue
        
        # Commit changes
        connection.commit()
        
        print("=" * 70)
        print("✅ UPDATE COMPLETE!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        print(f"   Total Bookings Processed: {total_bookings}")
        print(f"   Total Passengers: {total_passengers}")
        print(f"   Passengers Updated: {total_passengers_updated}")
        print(f"   Already Approved: {total_passengers - total_passengers_updated}")
        
        print(f"\n🎯 Next Steps:")
        print(f"   1. Refresh the Pax Movement Tracking page")
        print(f"   2. All {total_passengers} passengers should now be visible!")
        print(f"   3. Check the statistics cards for updated counts")
        print(f"   4. Check browser console to verify all passengers are approved")
        print("\n" + "=" * 70 + "\n")
        
        return True
        
    except pymysql.Error as e:
        print(f"\n❌ Database Error: {e}")
        return False
    
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        if 'connection' in locals() and connection.open:
            cursor.close()
            connection.close()
            print("🔒 Database connection closed\n")
    
    return True

if __name__ == "__main__":
    success = update_visa_statuses()
    
    if success:
        print("✅ Script completed successfully!")
        print("Refresh your browser now to see all passengers! 🚀\n")
    else:
        print("\n❌ Script failed. Please check the errors above.")
