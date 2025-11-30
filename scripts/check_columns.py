import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

tables = ['packages_foodprice', 'packages_ziaratprice']
cols = [
    'adult_selling_price',
    'adult_purchase_price',
    'child_selling_price',
    'child_purchase_price',
    'infant_selling_price',
    'infant_purchase_price',
]

with connection.cursor() as c:
    for table in tables:
        out = {}
        for col in cols:
            c.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME=%s", (table, col))
            out[col] = c.fetchone()[0]
        print(table, out)
