import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

# Remove columns that were partially created
with connection.cursor() as cursor:
    print("Cleaning up partially created columns...")
    
    # Drop foreign key constraints first
    try:
        cursor.execute("ALTER TABLE ledger_ledgerentry DROP FOREIGN KEY ledger_ledgerentry_booking_id_e7e1bc18_fk_booking_booking_id")
        print("✅ Dropped booking FK constraint")
    except Exception as e:
        print(f"⚠️  booking FK: {e}")
    
    # Drop agency_id and booking_id columns if they exist
    try:
        cursor.execute("ALTER TABLE ledger_ledgerentry DROP COLUMN agency_id")
        print("✅ Dropped agency_id")
    except Exception as e:
        print(f"⚠️  agency_id: {e}")
    
    try:
        cursor.execute("ALTER TABLE ledger_ledgerentry DROP COLUMN booking_id")
        print("✅ Dropped booking_id")
    except Exception as e:
        print(f"⚠️  booking_id: {e}")
    
    print("\nCurrent table structure:")
    cursor.execute("SHOW COLUMNS FROM ledger_ledgerentry")
    for col in cursor.fetchall():
        print(f"  - {col[0]}")
    
    print("\nDatabase cleanup complete!")
