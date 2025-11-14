#!/usr/bin/env python
"""
Script to seed organizations in the database.
Run with: python seed_organizations.py
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

def seed_organizations():
    """Create sample organizations in the database"""
    
    from django.db import connection
    cursor = connection.cursor()
    
    # Create table if not exists (simplified version)
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS organization_organization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    );
    """
    
    cursor.execute(create_table_sql)
    print("Created organization_organization table")
    
    # Sample organizations
    sample_orgs = [
        {'name': 'Main Organization', 'email': 'main@org.com', 'phone_number': '123-456-7890', 'org_code': 'MAIN001'},
        {'name': 'Link Organization 1', 'email': 'link1@org.com', 'phone_number': '123-456-7891', 'org_code': 'LINK001'},
        {'name': 'Link Organization 2', 'email': 'link2@org.com', 'phone_number': '123-456-7892', 'org_code': 'LINK002'},
        {'name': 'Link Organization 3', 'email': 'link3@org.com', 'phone_number': '123-456-7893', 'org_code': 'LINK003'},
    ]
    
    # Clear existing data
    cursor.execute("DELETE FROM organization_organization")
    print("Cleared existing organizations")
    
    # Insert new data
    from datetime import datetime
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    for org in sample_orgs:
        cursor.execute(f"""
            INSERT INTO organization_organization 
            (name, email, phone_number, address, logo, org_code)
            VALUES ('{org['name']}', '{org['email']}', '{org['phone_number']}', '', '', '{org['org_code']}')
        """)
    
    print(f"Inserted {len(sample_orgs)} organizations")
    
    # Verify data
    cursor.execute("SELECT id, name, email FROM organization_organization")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID {row[0]}: {row[1]} ({row[2]})")

if __name__ == "__main__":
    try:
        seed_organizations()
        print("✅ Organizations seeded successfully")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()