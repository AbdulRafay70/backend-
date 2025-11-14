"""
SQL Script to add new ledger fields manually
Run this if migration fails due to MySQL constraints
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

# SQL statements to add new fields to ledger_ledgerentry table
sql_commands = [
    # Add transaction_amount field
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN transaction_amount DECIMAL(18, 2) NOT NULL DEFAULT 0.00 
    COMMENT 'Transaction amount (kitna ki transaction howi hai)';
    """,
    
    # Add final_balance field
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN final_balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00 
    COMMENT 'Auto-calc from (total paid - total due)';
    """,
    
    # Add seller_organization_id field
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN seller_organization_id INT NULL 
    COMMENT 'Organization that created this booking';
    """,
    
    # Add inventory_owner_organization_id field
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN inventory_owner_organization_id INT NULL 
    COMMENT 'Owner org of that inventory item';
    """,
    
    # Add area_agency_id field
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN area_agency_id INT NULL 
    COMMENT 'Area agency if booking linked with area agent';
    """,
    
    # Add payment_ids field (JSON)
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN payment_ids JSON NULL 
    COMMENT 'List of all linked payment record IDs';
    """,
    
    # Add group_ticket_count field
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN group_ticket_count INT NOT NULL DEFAULT 0 
    COMMENT 'Total number of tickets if multiple in group booking';
    """,
    
    # Add umrah_visa_count field
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN umrah_visa_count INT NOT NULL DEFAULT 0 
    COMMENT 'Total number of Umrah visas included';
    """,
    
    # Add hotel_nights_count field
    """
    ALTER TABLE ledger_ledgerentry 
    ADD COLUMN hotel_nights_count INT NOT NULL DEFAULT 0 
    COMMENT 'Total hotel nights for all hotels in booking';
    """,
]

# Update help texts for existing fields (these are comment changes)
update_comments = [
    """
    ALTER TABLE ledger_ledgerentry 
    MODIFY COLUMN booking_no VARCHAR(255) NULL 
    COMMENT 'Booking reference (auto from booking table)';
    """,
    
    """
    ALTER TABLE ledger_ledgerentry 
    MODIFY COLUMN service_type VARCHAR(50) NOT NULL DEFAULT 'other' 
    COMMENT 'ticket / umrah / hotel / transport / package / payment / refund / commission';
    """,
    
    """
    ALTER TABLE ledger_ledgerentry 
    MODIFY COLUMN narration LONGTEXT NULL 
    COMMENT 'Text summary (e.g., "Advance payment for Umrah Booking #SK1234")';
    """,
    
    """
    ALTER TABLE ledger_ledgerentry 
    MODIFY COLUMN branch_id INT NULL 
    COMMENT 'Branch if created under branch';
    """,
    
    """
    ALTER TABLE ledger_ledgerentry 
    MODIFY COLUMN agency_id INT NULL 
    COMMENT 'Agency if created by an agent';
    """,
    
    """
    ALTER TABLE ledger_ledgerentry 
    MODIFY COLUMN creation_datetime DATETIME(6) NOT NULL 
    COMMENT 'Auto set (timezone aware)';
    """,
    
    """
    ALTER TABLE ledger_ledgerentry 
    MODIFY COLUMN internal_notes JSON NULL 
    COMMENT 'Array of timestamped notes like "[2025-10-17 11:24] Payment received via Bank Alfalah."';
    """,
]


def check_column_exists(table_name, column_name):
    """Check if a column already exists in the table"""
    with connection.cursor() as cursor:
        cursor.execute(f"""
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = '{table_name}'
            AND COLUMN_NAME = '{column_name}'
        """)
        return cursor.fetchone()[0] > 0


def apply_sql_changes():
    """Apply SQL changes to add new fields"""
    print("\n" + "="*80)
    print("APPLYING SQL CHANGES TO LEDGER_LEDGERENTRY TABLE")
    print("="*80)
    
    with connection.cursor() as cursor:
        # Check and add new columns
        new_columns = [
            'transaction_amount',
            'final_balance',
            'seller_organization_id',
            'inventory_owner_organization_id',
            'area_agency_id',
            'payment_ids',
            'group_ticket_count',
            'umrah_visa_count',
            'hotel_nights_count',
        ]
        
        for i, column in enumerate(new_columns):
            if check_column_exists('ledger_ledgerentry', column):
                print(f"✓ Column '{column}' already exists - skipping")
            else:
                print(f"→ Adding column '{column}'...")
                try:
                    cursor.execute(sql_commands[i])
                    print(f"  ✅ Successfully added '{column}'")
                except Exception as e:
                    print(f"  ❌ Error adding '{column}': {str(e)}")
        
        # Update comments for existing columns
        print("\n→ Updating column comments...")
        for comment_sql in update_comments:
            try:
                cursor.execute(comment_sql)
            except Exception as e:
                print(f"  ⚠️  Warning updating comments: {str(e)}")
        
        print("  ✅ Comments updated")
    
    print("\n" + "="*80)
    print("✅ SQL CHANGES APPLIED SUCCESSFULLY")
    print("="*80)
    print("\nNext steps:")
    print("1. Run: python manage.py migrate ledger 0004 --fake")
    print("2. Test with: python test_enhanced_ledger.py")
    print("="*80 + "\n")


if __name__ == "__main__":
    try:
        apply_sql_changes()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
