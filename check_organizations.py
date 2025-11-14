#!/usr/bin/env python
"""
Script to check what organizations exist in the database.
Run with: python check_organizations.py
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

def check_organizations():
    """Check what organizations exist in the database"""
    
    from django.db import connection
    cursor = connection.cursor()
    
    # Check if organization_organization table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='organization_organization'
    """)
    
    if not cursor.fetchone():
        print("❌ organization_organization table does not exist")
        return
    
    # Get all organizations
    cursor.execute("SELECT id, name, email FROM organization_organization")
    organizations = cursor.fetchall()
    
    print(f"Found {len(organizations)} organizations:")
    for org in organizations:
        print(f"ID {org[0]}: {org[1]} ({org[2]})")
    
    return [org[0] for org in organizations]

if __name__ == "__main__":
    try:
        existing_ids = check_organizations()
        if existing_ids:
            print(f"\nExisting organization IDs: {existing_ids}")
            print("Use these IDs when creating organization links")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()