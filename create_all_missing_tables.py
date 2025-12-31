
import os
import django
from django.core.management import call_command
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

print("Step 1: Checking which tables are missing...")
print("=" * 60)

# Get all expected tables from Django models
from django.apps import apps
expected_tables = set()
for model in apps.get_models():
    expected_tables.add(model._meta.db_table)

# Get actual tables in database
with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES")
    actual_tables = set(row[0] for row in cursor.fetchall())

missing_tables = expected_tables - actual_tables
print(f"\nFound {len(missing_tables)} missing tables:")
for table in sorted(missing_tables)[:20]:  # Show first 20
    print(f"  - {table}")
if len(missing_tables) > 20:
    print(f"  ... and {len(missing_tables) - 20} more")

if not missing_tables:
    print("\nNo missing tables! Database is in sync.")
    exit(0)

print("\n" + "=" * 60)
print("Step 2: Running migrate with --fake-initial...")
print("=" * 60)

try:
    # Use --fake-initial to skip existing tables
    call_command('migrate', fake_initial=True, verbosity=1)
    print("\nMigration completed!")
except Exception as e:
    print(f"\nMigration error: {str(e)[:200]}")

print("\n" + "=" * 60)
print("Step 3: Verifying results...")
print("=" * 60)

with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES")
    actual_tables_after = set(row[0] for row in cursor.fetchall())

still_missing = expected_tables - actual_tables_after
if still_missing:
    print(f"\nStill missing {len(still_missing)} tables:")
    for table in sorted(still_missing)[:10]:
        print(f"  - {table}")
    if len(still_missing) > 10:
        print(f"  ... and {len(still_missing) - 10} more")
else:
    print("\nAll tables created successfully!")
