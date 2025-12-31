
import os
import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

with connection.cursor() as cursor:
    tables = [
        "token_blacklist_blacklistedtoken",
        "token_blacklist_outstandingtoken",
    ]
    for table in tables:
        try:
            print(f"Dropping table {table} if exists...")
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print("Success.")
        except Exception as e:
            print(f"Error dropping {table}: {e}")
