#!/usr/bin/env python3
"""
Check whether the operations_hoteloperations table exists in the database Django is configured to use.
Run: python scripts\check_operations_table.py
"""
import os
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
import django
django.setup()

from django.db import connection

def main():
    with connection.cursor() as cursor:
        # Use introspection which is DB-agnostic
        tables = connection.introspection.table_names()
        target = 'operations_hoteloperations'
        print('Total tables in DB:', len(tables))
        print('Table exists?' , target in tables)
        # Show some nearby names for context
        matches = [t for t in tables if 'operations' in t or 'hotel' in t][:20]
        print('Sample matching tables:', matches)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        import traceback
        print('Error checking tables:', e)
        traceback.print_exc()
