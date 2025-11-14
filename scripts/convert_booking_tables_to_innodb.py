"""
Safe converter: find booking_* tables using MyISAM and ALTER TABLE ... ENGINE=InnoDB
This script uses Django's DB connection so you do NOT need mysql client installed.

Usage (PowerShell):
  python scripts\convert_booking_tables_to_innodb.py

Notes:
- Make a DB backup first. Example (PowerShell):
  mysqldump -u root -p saerpk_local > saerpk_local_backup.sql

- The script will print the tables it will change and ask for confirmation before running ALTER TABLE.
- If migration previously partially created tables (e.g. booking_hoteloutsourcing), you may still need to DROP that table or run `migrate --fake` depending on the schema.
"""
import os
import sys
from pathlib import Path

# ensure project root is importable
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

import django
django.setup()
from django.db import connection, transaction


def find_myisam_booking_tables():
    sql = (
        "SELECT TABLE_NAME, ENGINE "
        "FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME LIKE 'booking\_%' "
        "AND ENGINE != 'InnoDB'"
    )
    with connection.cursor() as cursor:
        cursor.execute(sql)
        rows = cursor.fetchall()
    return [r[0] for r in rows]


def convert_table_to_innodb(table_name):
    sql = f"ALTER TABLE `{table_name}` ENGINE=InnoDB;"
    with connection.cursor() as cursor:
        cursor.execute(sql)


if __name__ == '__main__':
    print("Detecting booking_* tables that are not InnoDB...")
    tables = find_myisam_booking_tables()
    if not tables:
        print("No booking_* tables using non-InnoDB engines found. Nothing to do.")
        sys.exit(0)

    print("The following booking_* tables are not InnoDB and will be converted:")
    for t in tables:
        print('  -', t)

    confirm = input("Proceed to convert these tables to InnoDB? (yes/NO): ")
    if confirm.strip().lower() not in ('yes', 'y'):
        print("Aborted by user.")
        sys.exit(0)

    # run conversions in a transaction block per-table (note: ALTER TABLE commits implicitly in MySQL)
    for t in tables:
        try:
            print(f"Converting {t} -> InnoDB...")
            convert_table_to_innodb(t)
            print(f"Converted {t}.")
        except Exception as e:
            print(f"Failed converting {t}: {e}")
            print("STOPPING. Please review DB and do not proceed until fixed.")
            sys.exit(1)

    print("All requested tables converted to InnoDB.")
    print("Next steps:")
    print("  1) Run: python manage.py migrate")
    print("  2) If migrate errors about an existing partially created table (e.g. booking_hoteloutsourcing), either:")
    print("       - DROP TABLE booking_hoteloutsourcing; then re-run migrate, OR")
    print("       - If the existing table matches the migration schema exactly, run: python manage.py migrate --fake booking 0068")
    print("    I can help inspect the existing table schema to recommend Drop vs --fake if you want.")
