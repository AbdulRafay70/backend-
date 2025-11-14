import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Check if organization_agency table exists
cursor.execute("SHOW TABLES LIKE 'organization_agency'")
result = cursor.fetchall()

if result:
    print(f"✓ organization_agency table exists: {result}")
else:
    print("✗ organization_agency table NOT found")

# Check if organization_employee table exists
cursor.execute("SHOW TABLES LIKE 'organization_employee'")
result2 = cursor.fetchall()

if result2:
    print(f"✓ organization_employee table exists: {result2}")
else:
    print("✗ organization_employee table NOT found")

# Show all organization tables
cursor.execute("SHOW TABLES LIKE 'organization%'")
org_tables = cursor.fetchall()
print(f"\nAll organization tables ({len(org_tables)}):")
for table in org_tables:
    print(f"  - {table[0]}")

cursor.close()
