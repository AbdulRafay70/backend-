import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

with connection.cursor() as cur:
    cur.execute('SHOW COLUMNS FROM pax_movements_paxmovement')
    rows = cur.fetchall()

for r in rows:
    print(r)
