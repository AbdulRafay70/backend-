"""
Update Visa Statuses in booking_bookingpersondetail table
For all passengers in approved bookings (Organization 11)
"""

import pymysql

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
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("✅ Connected to saerpk_local successfully!\n")
        
        # Get all person details for approved bookings in org 11
        query = """
            SELECT 
                p.id,
                p.first_name,
                p.last_name,
                p.visa_status,
                b.booking_number
            FROM booking_bookingpersondetail p
            JOIN booking_booking b ON p.booking_id = b.id
            WHERE b.status = 'Approved' 
            AND b.organization_id = 11
        """
        
        cursor.execute(query)
        passengers = cursor.fetchall()
        
        total_passengers = len(passengers)
        passengers_to_update = []
        
        print(f"📦 Found {total_passengers} passengers in approved bookings\n")
        print("=" * 70)
        print("Checking Visa Statuses...")
        print("=" * 70 + "\n")
        
        for person_id, first_name, last_name, visa_status, booking_number in passengers:
            person_name = f"{first_name} {last_name}"
            
            if visa_status != 'Approved':
                passengers_to_update.append(person_id)
                print(f"   ❌ {person_name} ({booking_number}): {visa_status} → Will update to Approved")
            else:
                print(f"   ✅ {person_name} ({booking_number}): Already Approved")
        
        if passengers_to_update:
            print(f"\n📝 Updating {len(passengers_to_update)} passengers...")
            
            # Update all at once
            placeholders = ','.join(['%s'] * len(passengers_to_update))
            update_query = f"""
                UPDATE booking_bookingpersondetail 
                SET visa_status = 'Approved'
                WHERE id IN ({placeholders})
            """
            
            cursor.execute(update_query, passengers_to_update)
            connection.commit()
            
            print(f"✅ Updated {cursor.rowcount} passengers successfully!")
        else:
            print("\n✅ All passengers already have Approved visa status!")
        
        print("\n" + "=" * 70)
        print("✅ UPDATE COMPLETE!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        print(f"   Total Passengers: {total_passengers}")
        print(f"   Updated to Approved: {len(passengers_to_update)}")
        print(f"   Already Approved: {total_passengers - len(passengers_to_update)}")
        
        print(f"\n🎯 Next Steps:")
        print(f"   1. Refresh the Pax Movement Tracking page")
        print(f"   2. All {total_passengers} passengers should now be visible!")
        print(f"   3. Check the statistics cards for updated counts")
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

if __name__ == "__main__":
    success = update_visa_statuses()
    
    if success:
        print("✅ Script completed successfully!")
        print("🚀 Refresh your browser now to see all passengers!\n")
    else:
        print("\n❌ Script failed. Please check the errors above.")
