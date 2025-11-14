import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("SHOW TABLES LIKE 'tickets%'")
tables = cursor.fetchall()

print("Tickets tables in database:")
for table in tables:
    print(f"  - {table[0]}")

if not tables:
    print("  No tickets tables found!")
