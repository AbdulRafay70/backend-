"""
Find passenger/person tables in database
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
    print("SEARCHING FOR PASSENGER/PERSON TABLES")
    print("=" * 70 + "\n")
    
    # Show all tables
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    print("Looking for passenger-related tables:\n")
    for table in tables:
        table_name = table[0]
        if 'person' in table_name.lower() or 'passenger' in table_name.lower() or 'pax' in table_name.lower():
            print(f"  ✓ Found: {table_name}")
            
            # Show columns
            cursor.execute(f"SHOW COLUMNS FROM {table_name}")
            columns = cursor.fetchall()
            print(f"    Columns:")
            for col in columns:
                print(f"      - {col[0]} ({col[1]})")
            print()
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"Error: {e}")
