import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

# Remove all partially created columns
with connection.cursor() as cursor:
    print("Cleaning up all partially created columns...")
    
    # Drop columns without FK constraints first
    for column in ['agency_id', 'branch_id']:
        try:
            cursor.execute(f"ALTER TABLE ledger_ledgerentry DROP COLUMN {column}")
            print(f"✅ Dropped {column}")
        except Exception as e:
            print(f"⚠️  {column}: {e}")
    
    # Check for FK constraints on booking_id
    cursor.execute("""
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'ledger_ledgerentry' 
          AND COLUMN_NAME = 'booking_id'
          AND CONSTRAINT_NAME != 'PRIMARY'
    """)
    fk_constraints = cursor.fetchall()
    
    # Drop FK constraints
    for (constraint_name,) in fk_constraints:
        try:
            cursor.execute(f"ALTER TABLE ledger_ledgerentry DROP FOREIGN KEY {constraint_name}")
            print(f"✅ Dropped FK constraint: {constraint_name}")
        except Exception as e:
            print(f"⚠️  FK {constraint_name}: {e}")
    
    # Now drop booking_id column
    try:
        cursor.execute("ALTER TABLE ledger_ledgerentry DROP COLUMN booking_id")
        print("✅ Dropped booking_id")
    except Exception as e:
        print(f"⚠️  booking_id: {e}")
    
    print("\nFinal table structure:")
    cursor.execute("SHOW COLUMNS FROM ledger_ledgerentry")
    for col in cursor.fetchall():
        print(f"  - {col[0]}")
    
    print("\n✅ Database cleanup complete!")
