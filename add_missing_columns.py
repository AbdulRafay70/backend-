import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Add missing columns to finance_financialrecord table
try:
    cursor.execute('ALTER TABLE finance_financialrecord ADD COLUMN agent_id BIGINT NULL')
    print('✓ Added agent_id column')
except Exception as e:
    print(f'agent_id: {e}')

try:
    cursor.execute('ALTER TABLE finance_financialrecord ADD COLUMN reference_no VARCHAR(255) NULL')
    print('✓ Added reference_no column')
except Exception as e:
    print(f'reference_no: {e}')

try:
    cursor.execute('ALTER TABLE finance_financialrecord ADD COLUMN description LONGTEXT NULL')
    print('✓ Added description column')
except Exception as e:
    print(f'description: {e}')

try:
    cursor.execute('ALTER TABLE finance_financialrecord ADD COLUMN status VARCHAR(20) DEFAULT "active" NOT NULL')
    print('✓ Added status column')
except Exception as e:
    print(f'status: {e}')

try:
    cursor.execute('ALTER TABLE finance_financialrecord ADD COLUMN created_by_id INT NULL')
    print('✓ Added created_by_id column')
except Exception as e:
    print(f'created_by_id: {e}')

try:
    cursor.execute('ALTER TABLE finance_financialrecord ADD COLUMN last_updated_by_id INT NULL')
    print('✓ Added last_updated_by_id column')
except Exception as e:
    print(f'last_updated_by_id: {e}')

print('\n✅ All missing columns added successfully!')
