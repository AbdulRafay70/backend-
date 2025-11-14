import os
import sys
from pathlib import Path

# ensure project root is on sys.path when script executed directly
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()
from django.db import connection

sql = "SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('booking_booking','booking_hoteloutsourcing')"
with connection.cursor() as cursor:
    cursor.execute(sql)
    rows = cursor.fetchall()
    print(rows)
