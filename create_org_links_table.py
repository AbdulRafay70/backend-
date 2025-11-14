#!/usr/bin/env python
"""
Script to create organization_links table and insert sample data.
Run with: python create_org_links_table.py
"""

import os
import sys
import django
from pathlib import Path
import sqlite3

# Add the project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

def create_table_and_insert_data():
    """Create the organization_links table and insert sample data"""
    
    # Connect to the database
    from django.db import connection
    cursor = connection.cursor()
    
    # Create table if not exists
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS organization_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_organization_id INTEGER NOT NULL,
        link_organization_id INTEGER NOT NULL,
        link_organization_request VARCHAR(20) NOT NULL,
        main_organization_request VARCHAR(20) NOT NULL,
        request_status BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (main_organization_id) REFERENCES organization_organization (id),
        FOREIGN KEY (link_organization_id) REFERENCES organization_organization (id)
    );
    """
    
    cursor.execute(create_table_sql)
    print("Created organization_links table")
    
    # Insert sample data matching the API response
    sample_data = [
        {
            'main_organization_id': 2,
            'link_organization_id': 3,
            'link_organization_request': 'PENDING',
            'main_organization_request': 'PENDING',
            'request_status': False,
        },
        {
            'main_organization_id': 2,
            'link_organization_id': 4,
            'link_organization_request': 'PENDING',
            'main_organization_request': 'PENDING',
            'request_status': False,
        },
        {
            'main_organization_id': 3,
            'link_organization_id': 2,
            'link_organization_request': 'ACCEPTED',
            'main_organization_request': 'ACCEPTED',
            'request_status': True,
        },
    ]
    
    # Clear existing data
    cursor.execute("DELETE FROM organization_links")
    print("Cleared existing data")
    
    # Insert new data
    from datetime import datetime
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    for item in sample_data:
        cursor.execute(f"""
            INSERT INTO organization_links 
            (main_organization_id, link_organization_id, link_organization_request, 
             main_organization_request, request_status, created_at, updated_at)
            VALUES ({item['main_organization_id']}, {item['link_organization_id']}, 
                    '{item['link_organization_request']}', '{item['main_organization_request']}', 
                    {1 if item['request_status'] else 0}, '{now}', '{now}')
        """)
    
    print(f"Inserted {len(sample_data)} organization links")
    
    # Verify data
    cursor.execute("SELECT COUNT(*) FROM organization_links")
    count = cursor.fetchone()[0]
    print(f"Total links in database: {count}")
    
    cursor.execute("SELECT id, main_organization_id, link_organization_id, link_organization_request, main_organization_request, request_status FROM organization_links")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID {row[0]}: Main={row[1]}, Link={row[2]}, Status={row[5]}")

if __name__ == "__main__":
    try:
        create_table_and_insert_data()
        print("✅ Organization links table created and data inserted successfully")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()