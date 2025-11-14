import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SHOW COLUMNS FROM ledger_ledgerentry")
    columns = cursor.fetchall()
    print("Current columns in ledger_ledgerentry:")
    for col in columns:
        print(f"  - {col[0]} ({col[1]})")
