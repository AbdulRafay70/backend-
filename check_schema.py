"""
Check database schema for booking table
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

try:
    connection = pymysql.connect(**DB_CONFIG)
    cursor = connection.cursor()
    
    print("\n" + "=" * 70)
    print("CHECKING DATABASE SCHEMA")
    print("=" * 70 + "\n")
    
    # Show columns in booking_booking table
    cursor.execute("SHOW COLUMNS FROM booking_booking")
    columns = cursor.fetchall()
    
    print("Columns in booking_booking table:\n")
    for col in columns:
        print(f"  - {col[0]} ({col[1]})")
    
    print("\n" + "=" * 70)
    
    # Show a sample booking
    cursor.execute("SELECT * FROM booking_booking WHERE status = 'Approved' AND organization_id = 11 LIMIT 1")
    sample = cursor.fetchone()
    
    if sample:
        print("\nSample booking data:")
        for i, col in enumerate(columns):
            print(f"  {col[0]}: {sample[i]}")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
