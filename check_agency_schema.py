"""
Check agency table schema
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
    
    cursor.execute("SHOW COLUMNS FROM organization_agency")
    columns = cursor.fetchall()
    
    print("\nColumns in organization_agency table:\n")
    for col in columns:
        print(f"  - {col[0]} ({col[1]})")
    
    # Get a sample agency
    cursor.execute("SELECT * FROM organization_agency LIMIT 1")
    sample = cursor.fetchone()
    
    if sample:
        print("\nSample agency:")
        for i, col in enumerate(columns):
            print(f"  {col[0]}: {sample[i]}")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"Error: {e}")
