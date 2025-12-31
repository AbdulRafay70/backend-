"""
Add Flight Dates Using Separate Tables
Uses booking_bookingticketdetails and booking_bookingtransportdetails tables
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

def add_flight_dates_to_tables():
    """Add flight and transport details using separate tables"""
    
    print("\n" + "=" * 70)
    print("ADDING FLIGHT DATES & TRANSPORT TO SEPARATE TABLES")
    print("=" * 70 + "\n")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("✅ Connected to database\n")
        
        now = datetime.now()
        
        # Get all test bookings with passengers
        cursor.execute("""
            SELECT b.id, b.booking_number, p.first_name, p.last_name, p.passport_number
            FROM booking_booking b
            JOIN booking_bookingpersondetail p ON p.booking_id = b.id
            WHERE b.status = 'Approved' AND b.organization_id = 11
            AND b.booking_number LIKE 'BK-%'
            ORDER BY b.id DESC
        """)
        
        bookings = cursor.fetchall()
        print(f"Found {len(bookings)} test bookings to process\n")
        
        updated_count = 0
        status_counts = {}
        
        for booking_id, booking_number, first_name, last_name, passport in bookings:
            
            # Determine status based on passport pattern
            status_config = None
            
            # Pakistan passengers (FI, NF, AR)
            if passport.startswith('FI') or passport.startswith('NF') or passport.startswith('AR'):
                status_config = {
                    'name': 'In Pakistan',
                    'icon': '🇵🇰',
                    'dep_days': 5,
                    'ret_days': 20,
                    'transport': 'Makkah',
                    'flight': 'PK-740'
                }
            
            # In Flight passengers (KS, HM, TA, RK)
            elif passport.startswith('KS') or passport.startswith('HM') or passport.startswith('TA') or passport.startswith('RK'):
                status_config = {
                    'name': 'In Flight',
                    'icon': '✈️',
                    'dep_hours': -2,
                    'arr_hours': 4,
                    'ret_days': 15,
                    'transport': 'Madina',
                    'flight': 'SV-722'
                }
            
            # In Makkah passengers (IH, KA, YH, MS)
            elif passport.startswith('IH') or passport.startswith('KA') or passport.startswith('YH') or passport.startswith('MS'):
                status_config = {
                    'name': 'In Makkah',
                    'icon': '🕋',
                    'dep_days': -3,
                    'ret_days': 12,
                    'transport': 'Makkah',
                    'flight': 'PK-750'
                }
            
            # In Madina passengers (UF, AZ, BT)
            elif passport.startswith('UF') or passport.startswith('AZ') or passport.startswith('BT'):
                status_config = {
                    'name': 'In Madina',
                    'icon': '🕌',
                    'dep_days': -5,
                    'ret_days': 10,
                    'transport': 'Madina',
                    'flight': 'SV-724'
                }
            
            # In Jeddah passengers (HQ, SN, AR017)
            elif passport.startswith('HQ') or passport.startswith('SN') or passport == 'AR017017':
                status_config = {
                    'name': 'In Jeddah',
                    'icon': '🏙️',
                    'dep_days': -1,
                    'ret_days': 7,
                    'transport': 'Jeddah',
                    'flight': 'PK-760'
                }
            
            # Exit Pending passengers (FM, AS, IB, SA)
            elif passport.startswith('FM') or passport.startswith('AS') or passport.startswith('IB') or passport.startswith('SA'):
                status_config = {
                    'name': 'Exit Pending',
                    'icon': '⏳',
                    'dep_days': -13,
                    'ret_days': 2,
                    'transport': 'Makkah',
                    'flight': 'SV-730'
                }
            
            # Exited KSA passengers (RA, FB, NA)
            elif passport.startswith('RA') or passport.startswith('FB') or passport.startswith('NA'):
                status_config = {
                    'name': 'Exited KSA',
                    'icon': '✅',
                    'dep_days': -20,
                    'ret_days': -2,
                    'transport': 'Makkah',
                    'flight': 'PK-770'
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
            
            # Delete existing ticket/transport
            cursor.execute("DELETE FROM booking_bookingticketdetails WHERE booking_id = %s", (booking_id,))
            cursor.execute("DELETE FROM booking_bookingtransportdetails WHERE booking_id = %s", (booking_id,))
            
            # Insert ticket details
            try:
                cursor.execute("""
                    INSERT INTO booking_bookingticketdetails 
                    (booking_id, flight_number, departure_airport, arrival_airport,
                     departure_date, departure_time, arrival_date, arrival_time,
                     return_date, return_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    booking_id,
                    status_config['flight'],
                    'Islamabad (ISB)',
                    'Jeddah (JED)',
                    dep_date,
                    dep_time,
                    arr_date,
                    arr_time,
                    ret_date,
                    '23:00'
                ))
            except Exception as e:
                print(f"   ⚠️  Ticket error for {first_name}: {e}")
            
            # Insert transport details
            try:
                cursor.execute("""
                    INSERT INTO booking_bookingtransportdetails 
                    (booking_id, departure_city, arrival_city, vehicle_type)
                    VALUES (%s, %s, %s, %s)
                """, (
                    booking_id,
                    'Jeddah',
                    status_config['transport'],
                    'Coaster'
                ))
            except Exception as e:
                print(f"   ⚠️  Transport error for {first_name}: {e}")
            
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
        
        print(f"\n🚀 REFRESH THE PAGE NOW!")
        print(f"   Expected Results:")
        print(f"   - Total Passengers: 33")
        print(f"   - 🇵🇰 In Pakistan: ~3")
        print(f"   - ✈️  In Flight: ~4")
        print(f"   - 🕋 In Makkah: ~4")
        print(f"   - 🕌 In Madina: ~3")
        print(f"   - 🏙️  In Jeddah: ~3")
        print(f"   - ⏳ Exit Pending: ~4")
        print(f"   - ✅ Exited KSA: ~3")
        print(f"   - + Original passengers")
        
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
    success = add_flight_dates_to_tables()
    
    if success:
        print("✅ All flight dates added!")
        print("🚀 REFRESH THE PAX MOVEMENT TRACKING PAGE NOW!\n")
    else:
        print("\n❌ Failed to add flight dates.")
