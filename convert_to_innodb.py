import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    print("Converting organization tables from MyISAM to InnoDB...")
    
    # List of organization tables to convert
    tables_to_convert = [
        'organization_branch',
        'organization_organization',
        'organization_agency',
        'organization_employee',
    ]
    
    for table in tables_to_convert:
        try:
            print(f"\nConverting {table}...")
            cursor.execute(f"ALTER TABLE {table} ENGINE=InnoDB")
            print(f"✓ Successfully converted {table} to InnoDB")
        except Exception as e:
            print(f"✗ Error converting {table}: {e}")
    
    print("\n\nVerifying conversions:")
    for table in tables_to_convert:
        cursor.execute(f"SHOW TABLE STATUS LIKE '{table}'")
        status = cursor.fetchone()
        if status:
            print(f"  {table}: {status[1]}")
