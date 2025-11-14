import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Check if organization_branch exists
    cursor.execute("SHOW TABLES LIKE 'organization_branch'")
    result = cursor.fetchone()
    if result:
        print("✓ Table 'organization_branch' EXISTS")
        
        # Check table structure
        cursor.execute("DESCRIBE organization_branch")
        columns = cursor.fetchall()
        print("\nTable structure:")
        for col in columns:
            print(f"  {col[0]}: {col[1]}")
            
        # Check engine
        cursor.execute("SHOW TABLE STATUS LIKE 'organization_branch'")
        status = cursor.fetchone()
        if status:
            print(f"\nTable Engine: {status[1]}")
    else:
        print("✗ Table 'organization_branch' DOES NOT EXIST")
    
    # List all organization tables
    cursor.execute("SHOW TABLES LIKE 'organization%'")
    tables = cursor.fetchall()
    print("\n\nAll organization tables:")
    for table in tables:
        print(f"  - {table[0]}")
