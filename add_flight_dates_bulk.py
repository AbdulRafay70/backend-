"""
Add Flight Dates and Transport Details to ALL Test Passengers
Updates passengers based on their passport patterns to set correct statuses
"""

import pymysql
from datetime import datetime, timedelta
import json

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'root',
    'database': 'saerpk_local',
    'charset': 'utf8mb4',
    'port': 3306
}

def add_flight_dates_bulk():
    """Add flight and transport details to all test passengers"""
    
    print("\n" + "=" * 70)
    print("ADDING FLIGHT DATES & TRANSPORT DETAILS")
    print("=" * 70 + "\n")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("✅ Connected to database\n")
        
        now = datetime.now()
        
        # Get all bookings with test passengers
        cursor.execute("""
            SELECT b.id, b.booking_number, p.first_name, p.last_name, p.passport_number
            FROM booking_booking b
            JOIN booking_bookingpersondetail p ON p.booking_id = b.id
            WHERE b.status = 'Approved' AND b.organization_id = 11
            ORDER BY b.id DESC
            LIMIT 50
        """)
        
        bookings = cursor.fetchall()
        print(f"Found {len(bookings)} bookings to process\n")
        
        updated_count = 0
        status_counts = {}
        
        for booking_id, booking_number, first_name, last_name, passport in bookings:
            
            # Determine status based on passport pattern or name
            status_config = None
            
            # Pakistan passengers (FI, NF, AR)
            if passport.startswith('FI') or passport.startswith('NF') or passport.startswith('AR'):
                status_config = {
                    'name': 'In Pakistan',
                    'icon': '🇵🇰',
                    'dep_days': 5,
                    'ret_days': 20,
                    'transport': 'Makkah'
                }
            
            # In Flight passengers (KS, HM, TA, RK)
            elif passport.startswith('KS') or passport.startswith('HM') or passport.startswith('TA') or passport.startswith('RK'):
                status_config = {
                    'name': 'In Flight',
                    'icon': '✈️',
                    'dep_hours': -2,
                    'arr_hours': 4,
                    'ret_days': 15,
                    'transport': 'Madina'
                }
            
            # In Makkah passengers (IH, KA, YH, MS)
            elif passport.startswith('IH') or passport.startswith('KA') or passport.startswith('YH') or passport.startswith('MS'):
                status_config = {
                    'name': 'In Makkah',
                    'icon': '🕋',
                    'dep_days': -3,
                    'ret_days': 12,
                    'transport': 'Makkah'
                }
            
            # In Madina passengers (UF, AZ, BT)
            elif passport.startswith('UF') or passport.startswith('AZ') or passport.startswith('BT'):
                status_config = {
                    'name': 'In Madina',
                    'icon': '🕌',
                    'dep_days': -5,
                    'ret_days': 10,
                    'transport': 'Madina'
                }
            
            # In Jeddah passengers (HQ, SN, AR017)
            elif passport.startswith('HQ') or passport.startswith('SN') or passport == 'AR017017':
                status_config = {
                    'name': 'In Jeddah',
                    'icon': '🏙️',
                    'dep_days': -1,
                    'ret_days': 7,
                    'transport': 'Jeddah'
                }
            
            # Exit Pending passengers (FM, AS, IB, SA)
            elif passport.startswith('FM') or passport.startswith('AS') or passport.startswith('IB') or passport.startswith('SA'):
                status_config = {
                    'name': 'Exit Pending',
                    'icon': '⏳',
                    'dep_days': -13,
                    'ret_days': 2,
                    'transport': 'Makkah'
                }
            
            # Exited KSA passengers (RA, FB, NA)
            elif passport.startswith('RA') or passport.startswith('FB') or passport.startswith('NA'):
                status_config = {
                    'name': 'Exited KSA',
                    'icon': '✅',
                    'dep_days': -20,
                    'ret_days': -2,
                    'transport': 'Makkah'
                }
            
            if not status_config:
                continue  # Skip if no config found
            
            # Calculate dates
            if 'dep_hours' in status_config:
                # In Flight scenario
                dep_dt = now + timedelta(hours=status_config['dep_hours'])
                arr_dt = now + timedelta(hours=status_config['arr_hours'])
                dep_date = dep_dt.strftime('%Y-%m-%d')
                arr_date = arr_dt.strftime('%Y-%m-%d')
                dep_time = dep_dt.strftime('%H:%M')
                arr_time = arr_dt.strftime('%H:%M')
            else:
                # Regular scenarios
                dep_date = (now + timedelta(days=status_config['dep_days'])).strftime('%Y-%m-%d')
                arr_date = dep_date
                dep_time = '03:00'
                arr_time = '09:00'
            
            ret_date = (now + timedelta(days=status_config['ret_days'])).strftime('%Y-%m-%d')
            
            # Create ticket_details JSON
            ticket_details = [{
                'flight_number': 'PK-740',
                'departure_airport': 'Islamabad (ISB)',
                'arrival_airport': 'Jeddah (JED)',
                'departure_date': dep_date,
                'departure_time': dep_time,
                'arrival_date': arr_date,
                'arrival_time': arr_time,
                'return_date': ret_date,
                'return_time': '23:00'
            }]
            
            # Create transport_details JSON
            transport_details = [{
                'departure_city': 'Jeddah',
                'arrival_city': status_config['transport'],
                'vehicle_type': 'Coaster'
            }]
            
            # Update booking with JSON fields
            cursor.execute("""
                UPDATE booking_booking
                SET ticket_details = %s, transport_details = %s
                WHERE id = %s
            """, (json.dumps(ticket_details), json.dumps(transport_details), booking_id))
            
            updated_count += 1
            status_name = status_config['name']
            status_counts[status_name] = status_counts.get(status_name, 0) + 1
            
            print(f"   {status_config['icon']} {first_name} {last_name} → {status_name}")
        
        connection.commit()
        
        print("\n" + "=" * 70)
        print("✅ FLIGHT DATES ADDED!")
        print("=" * 70)
        print(f"\n📊 Passengers Updated by Status:")
        for status, count in sorted(status_counts.items()):
            print(f"   {count} passengers → {status}")
        
        print(f"\n   📈 Total Updated: {updated_count}")
        
        print(f"\n🚀 Next Steps:")
        print(f"   1. Refresh the Pax Movement Tracking page")
        print(f"   2. You should see ~31 total passengers")
        print(f"   3. Check statistics cards - each should have counts")
        print(f"   4. Click each status card to filter")
        print(f"   5. Search by name to find specific passengers")
        print(f"   6. Open browser console (F12) to see logs")
        
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

if __name__ == "__main__":
    success = add_flight_dates_bulk()
    
    if success:
        print("✅ All flight dates added!")
        print("🚀 Refresh the Pax Movement Tracking page now!\n")
    else:
        print("\n❌ Failed to add flight dates.")
