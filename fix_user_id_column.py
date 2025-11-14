import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Alter the user_id column to allow NULL
print("Altering organization_employee table to make user_id nullable...")
try:
    cursor.execute("""
        ALTER TABLE organization_employee 
        MODIFY COLUMN user_id integer NULL
    """)
    print("✓ Successfully made user_id column nullable")
except Exception as e:
    print(f"✗ Error: {e}")

# Verify the change
cursor.execute("SHOW COLUMNS FROM organization_employee LIKE 'user_id'")
result = cursor.fetchone()
print(f"\nColumn info: {result}")

cursor.close()
