
import os
import django
from django.core.management import call_command
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.apps import apps

# Get missing tables by app
print("Analyzing missing tables by app...")
print("=" * 60)

app_missing_tables = {}
with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES")
    actual_tables = set(row[0] for row in cursor.fetchall())

for model in apps.get_models():
    table_name = model._meta.db_table
    if table_name not in actual_tables:
        app_label = model._meta.app_label
        if app_label not in app_missing_tables:
            app_missing_tables[app_label] = []
        app_missing_tables[app_label].append(table_name)

print(f"\nApps with missing tables:")
for app, tables in sorted(app_missing_tables.items()):
    print(f"  {app}: {len(tables)} tables missing")

print("\n" + "=" * 60)
print("Resetting and re-running migrations for affected apps...")
print("=" * 60)

for app_label in sorted(app_missing_tables.keys()):
    print(f"\n[{app_label}]")
    try:
        print(f"  Resetting to zero...")
        call_command('migrate', '--fake', app_label, 'zero', verbosity=0)
        print(f"  Re-running migrations...")
        call_command('migrate', app_label, verbosity=0)
        print(f"  SUCCESS")
    except Exception as e:
        error_msg = str(e)[:150]
        print(f"  ERROR: {error_msg}")

print("\n" + "=" * 60)
print("Final verification...")
print("=" * 60)

with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES")
    actual_tables_final = set(row[0] for row in cursor.fetchall())

still_missing = 0
for model in apps.get_models():
    if model._meta.db_table not in actual_tables_final:
        still_missing += 1

if still_missing == 0:
    print("\nSUCCESS: All tables created!")
else:
    print(f"\nStill missing {still_missing} tables")
