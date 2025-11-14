import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # List all customer tables
    cursor.execute("SHOW TABLES LIKE 'customers%'")
    tables = cursor.fetchall()
    
    if tables:
        print("Found existing customers tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        print("\n Dropping all customers tables...")
        for table in tables:
            table_name = table[0]
            try:
                cursor.execute(f"DROP TABLE {table_name}")
                print(f"✓ Dropped {table_name}")
            except Exception as e:
                print(f"✗ Error dropping {table_name}: {e}")
    else:
        print("No customers tables found")
