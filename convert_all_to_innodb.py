import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    print("Finding all tables and checking their engines...")
    
    cursor.execute("SHOW TABLES")
    all_tables = [table[0] for table in cursor.fetchall()]
    
    myisam_tables = []
    for table in all_tables:
        cursor.execute(f"SHOW TABLE STATUS LIKE '{table}'")
        status = cursor.fetchone()
        if status and status[1] == 'MyISAM':
            myisam_tables.append(table)
    
    if myisam_tables:
        print(f"\nFound {len(myisam_tables)} MyISAM tables that need conversion:\n")
        for table in myisam_tables:
            print(f"  - {table}")
        
        print("\n\nConverting all MyISAM tables to InnoDB...\n")
        for table in myisam_tables:
            try:
                cursor.execute(f"ALTER TABLE {table} ENGINE=InnoDB")
                print(f"✓ Converted {table}")
            except Exception as e:
                print(f"✗ Error converting {table}: {e}")
    else:
        print("\n✓ All tables are already InnoDB!")
