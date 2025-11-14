#!/usr/bin/env python3
"""
Print applied migrations for the operations app from django_migrations table.
"""
import os, sys
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
import django
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT app, name, applied FROM django_migrations WHERE app = 'operations' ORDER BY applied")
    rows = cursor.fetchall()
    print('Applied migrations (operations):')
    for r in rows:
        print(r)
