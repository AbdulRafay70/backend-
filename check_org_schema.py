#!/usr/bin/env python
"""
Script to check the schema of organization_organization table.
Run with: python check_org_schema.py
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

def check_org_schema():
    """Check the schema of organization_organization table"""
    
    from django.db import connection
    cursor = connection.cursor()
    
    # Get table schema
    cursor.execute("PRAGMA table_info(organization_organization)")
    columns = cursor.fetchall()
    
    print("organization_organization table schema:")
    for col in columns:
        print(f"  {col[1]} ({col[2]}) {'NOT NULL' if col[3] else ''} {'PRIMARY KEY' if col[5] else ''}")

if __name__ == "__main__":
    try:
        check_org_schema()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()