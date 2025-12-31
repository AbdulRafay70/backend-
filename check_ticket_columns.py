"""
Check actual column names in ticket and transport tables
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
    
    print("\n=== TICKET TABLE COLUMNS ===")
    cursor.execute("SHOW COLUMNS FROM booking_bookingticketdetails")
    for col in cursor.fetchall():
        print(f"  - {col[0]} ({col[1]})")
    
    print("\n=== TRANSPORT TABLE COLUMNS ===")
    cursor.execute("SHOW COLUMNS FROM booking_bookingtransportdetails")
    for col in cursor.fetchall():
        print(f"  - {col[0]} ({col[1]})")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"Error: {e}")
