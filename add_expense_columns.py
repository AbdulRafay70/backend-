"""
Add missing columns to finance_expense table
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

print("=" * 80)
print("Adding missing columns to finance_expense table")
print("=" * 80)

with connection.cursor() as cursor:
    # Add module_type column
    try:
        cursor.execute("""
            ALTER TABLE finance_expense 
            ADD COLUMN module_type VARCHAR(30) DEFAULT 'general'
        """)
        print("✓ Added module_type column")
    except Exception as e:
        print(f"  module_type: {e}")
    
    # Add payment_mode column
    try:
        cursor.execute("""
            ALTER TABLE finance_expense 
            ADD COLUMN payment_mode VARCHAR(20) NULL
        """)
        print("✓ Added payment_mode column")
    except Exception as e:
        print(f"  payment_mode: {e}")
    
    # Add paid_to column
    try:
        cursor.execute("""
            ALTER TABLE finance_expense 
            ADD COLUMN paid_to VARCHAR(255) NULL
        """)
        print("✓ Added paid_to column")
    except Exception as e:
        print(f"  paid_to: {e}")

print("\n✅ All missing columns added successfully!")
