import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

# Add remaining columns manually
with connection.cursor() as cursor:
    print("Adding remaining ledger columns manually...")
    
    # Check which columns already exist
    cursor.execute("SHOW COLUMNS FROM ledger_ledgerentry")
    existing_columns = [col[0] for col in cursor.fetchall()]
    print(f"\nExisting columns: {existing_columns}\n")
    
    # List of columns to add with their SQL
    columns_to_add = {
        'booking_id': "ALTER TABLE ledger_ledgerentry ADD COLUMN booking_id bigint NULL",
        'agency_id': "ALTER TABLE ledger_ledgerentry ADD COLUMN agency_id bigint NULL",
        'branch_id': "ALTER TABLE ledger_ledgerentry ADD COLUMN branch_id bigint NULL",
        'reversed_by_id': "ALTER TABLE ledger_ledgerentry ADD COLUMN reversed_by_id int NULL",
        'updated_at': "ALTER TABLE ledger_ledgerentry ADD COLUMN updated_at datetime(6) NOT NULL DEFAULT '2025-01-01 00:00:00'"
    }
    
    # Add each column if it doesn't exist
    for column_name, sql in columns_to_add.items():
        if column_name not in existing_columns:
            try:
                cursor.execute(sql)
                print(f"✅ Added {column_name}")
            except Exception as e:
                print(f"⚠️  {column_name}: {e}")
        else:
            print(f"✓  {column_name} already exists")
    
    # Add indexes
    print("\nAdding indexes...")
    indexes = {
        'ledger_ledg_referen_a4e366_idx': "CREATE INDEX ledger_ledg_referen_a4e366_idx ON ledger_ledgerentry (reference_no, organization_id)",
        'ledger_ledg_booking_6df94a_idx': "CREATE INDEX ledger_ledg_booking_6df94a_idx ON ledger_ledgerentry (booking_no, transaction_type)",
        'ledger_ledg_created_b9f67d_idx': "CREATE INDEX ledger_ledg_created_b9f67d_idx ON ledger_ledgerentry (created_at)"
    }
    
    for index_name, sql in indexes.items():
        try:
            cursor.execute(sql)
            print(f"✅ Created index {index_name}")
        except Exception as e:
            if "Duplicate key name" in str(e):
                print(f"✓  Index {index_name} already exists")
            else:
                print(f"⚠️  {index_name}: {e}")
    
    # Now handle ledger_ledgerline table
    print("\nUpdating ledger_ledgerline table...")
    cursor.execute("SHOW COLUMNS FROM ledger_ledgerline")
    ledgerline_columns = [col[0] for col in cursor.fetchall()]
    
    if 'balance_after' not in ledgerline_columns:
        cursor.execute("ALTER TABLE ledger_ledgerline ADD COLUMN balance_after decimal(15, 2) NOT NULL DEFAULT 0.00")
        print("✅ Added balance_after to ledgerline")
    else:
        print("✓  balance_after already exists in ledgerline")
    
    if 'remarks' not in ledgerline_columns:
        cursor.execute("ALTER TABLE ledger_ledgerline ADD COLUMN remarks longtext NULL")
        print("✅ Added remarks to ledgerline")
    else:
        print("✓  remarks already exists in ledgerline")
    
    print("\n✅ Manual migration complete!")
    
    # Show final structure
    print("\nFinal ledger_ledgerentry structure:")
    cursor.execute("SHOW COLUMNS FROM ledger_ledgerentry")
    for col in cursor.fetchall():
        print(f"  - {col[0]} ({col[1]})")
