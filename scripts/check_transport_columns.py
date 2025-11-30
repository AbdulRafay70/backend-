import os
import sys
import django
from django.db import connection

# Make sure project root is on sys.path so Django settings can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()
with connection.cursor() as c:
    c.execute("SHOW COLUMNS FROM packages_transportsectorprice")
    rows = c.fetchall()
    print('\n'.join([r[0] for r in rows]))
