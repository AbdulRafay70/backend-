import os
import sys
import django
from django.db import connection

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(ROOT)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

django.setup()
from packages.models import UmrahPackage

pkg = UmrahPackage.objects.order_by('-id').first()
if not pkg:
    print('No UmrahPackage found')
    sys.exit(0)

print('Package id:', pkg.id, 'title:', getattr(pkg, 'title', None))
keys = [
    'makkah_ziyarat_selling_price',
    'makkah_ziarat_purchase_price',
    'makkah_ziyarat_purchase_price',
    'madinah_ziyarat_selling_price',
    'madinah_ziarat_purchase_price',
    'madinah_ziyarat_purchase_price',
    'food_purchase_price',
    'transport_purchase_price'
]
for k in keys:
    print(k, ':', getattr(pkg, k, None))

# Also print raw SQL columns for clarity
with connection.cursor() as c:
    c.execute("SHOW COLUMNS FROM packages_umrahpackage")
    cols = c.fetchall()
    print('\nDB columns (packages_umrahpackage):')
    for col in cols:
        print(col[0])
