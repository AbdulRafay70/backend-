"""
Add Complete Test Data with Flight Dates and Transport
Adds ticket_details and transport_details JSON to bookings
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

def add_complete_test_data():
    """Add flight dates and transport as JSON to bookings"""
    
    print("\n" + "=" * 70)
    print("ADDING COMPLETE TEST DATA - FLIGHT DATES & TRANSPORT")
    print("=" * 70 + "\n")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("✅ Connected to database\n")
        
        # First, check if ticket_details and transport_details columns exist
        cursor.execute("SHOW COLUMNS FROM booking_booking LIKE 'ticket_details'")
        has_ticket_col = cursor.fetchone() is not None
        
        cursor.execute("SHOW COLUMNS FROM booking_booking LIKE 'transport_details'")
        has_transport_col = cursor.fetchone() is not None
        
        if not has_ticket_col or not has_transport_col:
            print("❌ Error: booking_booking table doesn't have ticket_details or transport_details columns")
            print("   These columns need to be added to the database schema first.")
            return False
        
        print("✅ Found ticket_details and transport_details columns\n")
        
        now = datetime.now()
        
        # Get all test bookings
        cursor.execute("""
            SELECT b.id, b.booking_number, p.first_name, p.last_name, p.passport_number
            FROM booking_booking b
            JOIN booking_bookingpersondetail p ON p.booking_id = b.id
            WHERE b.status = 'Approved' AND b.organization_id = 11
            AND (b.booking_number LIKE 'BK-%' OR b.booking_number LIKE 'TEST-%')
            ORDER BY b.id DESC
        """)
        
        bookings = cursor.fetchall()
        print(f"Found {len(bookings)} test bookings to process\n")
        
        updated_count = 0
        status_counts = {}
        
        for booking_id, booking_number, first_name, last_name, passport in bookings:
            
            # Determine status configuration based on passport
            config = get_status_config(passport, now)
            
            if not config:
                continue
            
            # Create ticket_details JSON
            ticket_details = [{
                'flight_number': config['flight'],
                'departure_airport': 'Islamabad (ISB)',
                'arrival_airport': 'Jeddah (JED)',
                'departure_date': config['dep_date'],
                'departure_time': config['dep_time'],
                'arrival_date': config['arr_date'],
                'arrival_time': config['arr_time'],
                'return_date': config['ret_date'],
                'return_time': '23:00'
            }]
            
            # Create transport_details JSON
            transport_details = [{
                'departure_city': 'Jeddah',
                'arrival_city': config['transport'],
                'vehicle_type': 'Coaster'
            }]
            
            # Update booking
            cursor.execute("""
                UPDATE booking_booking
                SET ticket_details = %s, transport_details = %s
                WHERE id = %s
            """, (json.dumps(ticket_details), json.dumps(transport_details), booking_id))
            
            updated_count += 1
            status_name = config['name']
            status_counts[status_name] = status_counts.get(status_name, 0) + 1
            
            print(f"   {config['icon']} {first_name} {last_name} → {status_name}")
        
        connection.commit()
        
        print("\n" + "=" * 70)
        print("✅ TEST DATA COMPLETE!")
        print("=" * 70)
        print(f"\n📊 Passengers by Expected Status:")
        for status, count in sorted(status_counts.items()):
            print(f"   {count} passengers → {status}")
        
        print(f"\n   📈 Total Updated: {updated_count}")
        
        print(f"\n🚀 REFRESH THE PAGE NOW!")
        print(f"\n   Expected Distribution:")
        print(f"   - 🇵🇰 In Pakistan: 3-4 passengers")
        print(f"   - ✈️  In Flight: 4 passengers")
        print(f"   - 🕋 In Makkah: 4 passengers")
        print(f"   - 🕌 In Madina: 3 passengers")
        print(f"   - 🏙️  In Jeddah: 2-3 passengers")
        print(f"   - ⏳ Exit Pending: 4 passengers")
        print(f"   - ✅ Exited KSA: 3 passengers")
        
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

def get_status_config(passport, now):
    """Get status configuration based on passport pattern"""
    
    # Pakistan passengers (FI, NF, AR)
    if passport.startswith('FI') or passport.startswith('NF') or passport.startswith('AR') or passport.startswith('AB'):
        dep_date = (now + timedelta(days=5)).strftime('%Y-%m-%d')
        return {
            'name': 'In Pakistan',
            'icon': '🇵🇰',
            'dep_date': dep_date,
            'dep_time': '03:00',
            'arr_date': dep_date,
            'arr_time': '09:00',
            'ret_date': (now + timedelta(days=20)).strftime('%Y-%m-%d'),
            'transport': 'Makkah',
            'flight': 'PK-740'
        }
    
    # In Flight passengers (KS, HM, TA, RK, ZA, SA222)
    elif passport.startswith('KS') or passport.startswith('HM') or passport.startswith('TA') or passport.startswith('RK') or passport.startswith('ZA') or passport == 'SA222222':
        dep_dt = now - timedelta(hours=2)
        arr_dt = now + timedelta(hours=4)
        return {
            'name': 'In Flight',
            'icon': '✈️',
            'dep_date': dep_dt.strftime('%Y-%m-%d'),
            'dep_time': dep_dt.strftime('%H:%M'),
            'arr_date': arr_dt.strftime('%Y-%m-%d'),
            'arr_time': arr_dt.strftime('%H:%M'),
            'ret_date': (now + timedelta(days=15)).strftime('%Y-%m-%d'),
            'transport': 'Madina',
            'flight': 'SV-722'
        }
    
    # In Makkah passengers (IH, KA, YH, MS, HK)
    elif passport.startswith('IH') or passport.startswith('KA') or passport.startswith('YH') or passport.startswith('MS') or passport.startswith('HK'):
        dep_date = (now - timedelta(days=3)).strftime('%Y-%m-%d')
        return {
            'name': 'In Makkah',
            'icon': '🕋',
            'dep_date': dep_date,
            'dep_time': '03:00',
            'arr_date': dep_date,
            'arr_time': '09:00',
            'ret_date': (now + timedelta(days=12)).strftime('%Y-%m-%d'),
            'transport': 'Makkah',
            'flight': 'PK-750'
        }
    
    # In Madina passengers (UF, AZ, BT)
    elif passport.startswith('UF') or passport.startswith('AZ') or passport.startswith('BT'):
        dep_date = (now - timedelta(days=5)).strftime('%Y-%m-%d')
        return {
            'name': 'In Madina',
            'icon': '🕌',
            'dep_date': dep_date,
            'dep_time': '03:00',
            'arr_date': dep_date,
            'arr_time': '09:00',
            'ret_date': (now + timedelta(days=10)).strftime('%Y-%m-%d'),
            'transport': 'Madina',
            'flight': 'SV-724'
        }
    
    # In Jeddah passengers (HQ, SN, AR017)
    elif passport.startswith('HQ') or passport.startswith('SN') or passport == 'AR017017':
        dep_date = (now - timedelta(days=1)).strftime('%Y-%m-%d')
        return {
            'name': 'In Jeddah',
            'icon': '🏙️',
            'dep_date': dep_date,
            'dep_time': '03:00',
            'arr_date': dep_date,
            'arr_time': '09:00',
            'ret_date': (now + timedelta(days=7)).strftime('%Y-%m-%d'),
            'transport': 'Jeddah',
            'flight': 'PK-760'
        }
    
    # Exit Pending passengers (FM, AS, IB, SA, AM, OH)
    elif passport.startswith('FM') or passport.startswith('AS') or passport.startswith('IB') or passport.startswith('SA') or passport.startswith('AM') or passport.startswith('OH'):
        dep_date = (now - timedelta(days=13)).strftime('%Y-%m-%d')
        return {
            'name': 'Exit Pending',
            'icon': '⏳',
            'dep_date': dep_date,
            'dep_time': '03:00',
            'arr_date': dep_date,
            'arr_time': '09:00',
            'ret_date': (now + timedelta(days=2)).strftime('%Y-%m-%d'),
            'transport': 'Makkah',
            'flight': 'SV-730'
        }
    
    # Exited KSA passengers (RA, FB, NA)
    elif passport.startswith('RA') or passport.startswith('FB') or passport.startswith('NA'):
        dep_date = (now - timedelta(days=20)).strftime('%Y-%m-%d')
        return {
            'name': 'Exited KSA',
            'icon': '✅',
            'dep_date': dep_date,
            'dep_time': '03:00',
            'arr_date': dep_date,
            'arr_time': '09:00',
            'ret_date': (now - timedelta(days=2)).strftime('%Y-%m-%d'),
            'transport': 'Makkah',
            'flight': 'PK-770'
        }
    
    return None

if __name__ == "__main__":
    success = add_complete_test_data()
    
    if success:
        print("✅ All test data added!")
        print("🚀 REFRESH THE PAX MOVEMENT TRACKING PAGE NOW!\n")
    else:
        print("\n❌ Failed to add test data.")
        print("   Check if ticket_details and transport_details columns exist in booking_booking table.\n")
