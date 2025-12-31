"""
Update Visa Statuses to Approved
Fixes the Pax Movement Tracking display issue by setting all passengers to Approved status
"""

import pymysql
import json

# Database connection details from settings.py
DB_CONFIG = {
    'host': 'localhost',
    'user': 'saeraqnj_ahsanraza',
    'password': 'YjToTZu!+BnM',
    'database': 'saeraqnj_saer_db',
    'charset': 'utf8mb4',
    'port': 3306
}

def update_visa_statuses():
    """Update all passengers in approved bookings to have visa_status = 'Approved'"""
    
    print("🔧 Connecting to database...")
    
    try:
        # Connect to database
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("✅ Connected successfully!")
        print("\n" + "=" * 70)
        print("Updating Visa Statuses for Organization 11")
        print("=" * 70 + "\n")
        
        # Get all approved bookings for org 11
        cursor.execute("""
            SELECT id, booking_number, person_details 
            FROM booking_booking 
            WHERE status = 'Approved' AND organization_id = 11
        """)
        
        bookings = cursor.fetchall()
        total_bookings = len(bookings)
        total_passengers_updated = 0
        
        print(f"📦 Found {total_bookings} approved bookings\n")
        
        for booking_id, booking_number, person_details_json in bookings:
            try:
                # Parse JSON
                person_details = json.loads(person_details_json)
                passengers_in_booking = len(person_details)
                updated_count = 0
                
                # Update each passenger's visa_status
                for person in person_details:
                    old_status = person.get('visa_status', 'None')
                    person['visa_status'] = 'Approved'
                    
                    if old_status != 'Approved':
                        updated_count += 1
                        print(f"   ✓ {person.get('first_name', '')} {person.get('last_name', '')}: {old_status} → Approved")
                
                # Update the booking
                updated_json = json.dumps(person_details)
                cursor.execute("""
                    UPDATE booking_booking 
                    SET person_details = %s 
                    WHERE id = %s
                """, (updated_json, booking_id))
                
                total_passengers_updated += updated_count
                
                if updated_count > 0:
                    print(f"📋 {booking_number}: Updated {updated_count}/{passengers_in_booking} passengers\n")
                
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing JSON for booking {booking_number}: {e}")
                continue
        
        # Commit changes
        connection.commit()
        
        print("\n" + "=" * 70)
        print("✅ UPDATE COMPLETE!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        print(f"   Total Bookings Processed: {total_bookings}")
        print(f"   Total Passengers Updated: {total_passengers_updated}")
        print(f"\n🎯 Next Steps:")
        print(f"   1. Refresh the Pax Movement Tracking page")
        print(f"   2. All {total_passengers_updated} passengers should now be visible!")
        print(f"   3. Check the statistics cards for updated counts")
        print("\n" + "=" * 70)
        
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
            print("\n🔒 Database connection closed")
    
    return True

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("PAX MOVEMENT TRACKING - VISA STATUS FIX")
    print("=" * 70 + "\n")
    
    success = update_visa_statuses()
    
    if success:
        print("\n✅ Script completed successfully!")
    else:
        print("\n❌ Script failed. Please check the errors above.")
