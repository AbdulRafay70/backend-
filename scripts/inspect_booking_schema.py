import os
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
import django
django.setup()
from django.db import connection

def show_columns(table):
    sql = "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s"
    with connection.cursor() as cursor:
        cursor.execute(sql, [table])
        rows = cursor.fetchall()
    print(f"\n--- Columns for {table} ---")
    if not rows:
        print('  (table not found)')
    for r in rows:
        print(' ', r)


def show_table_exists(table):
    sql = "SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s"
    with connection.cursor() as cursor:
        cursor.execute(sql, [table])
        rows = cursor.fetchall()
    print(f"\n--- Table {table} info ---")
    if not rows:
        print('  (not found)')
    else:
        print(' ', rows[0])


if __name__ == '__main__':
    tables = ['booking_booking','booking_bookinghoteldetails','booking_hoteloutsourcing']
    for t in tables:
        show_table_exists(t)
        show_columns(t)
    print('\nDone')
