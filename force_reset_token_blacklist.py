
import os
import django
from django.db import connection
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

print("1. Clearing migration history for token_blacklist...")
try:
    call_command("migrate", "--fake", "token_blacklist", "zero")
except Exception as e:
    print(f"Warning clearing history: {e}")

print("2. Dropping token_blacklist tables...")
with connection.cursor() as cursor:
    # Disable FK checks to allow dropping widely
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    tables = [
        "token_blacklist_blacklistedtoken",
        "token_blacklist_outstandingtoken",
    ]
    for table in tables:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"Dropped {table}")
        except Exception as e:
            print(f"Error dropping {table}: {e}")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

print("3. Running migrations for token_blacklist...")
try:
    call_command("migrate", "token_blacklist")
    print("Migration successful.")
except Exception as e:
    print(f"Migration failed: {e}")
