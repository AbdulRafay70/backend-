import os
import sys
import django

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(ROOT)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

django.setup()
from django.db import transaction
from packages.models import UmrahPackage, UmrahPackageTransportDetails
from organization.models import Organization
from django.contrib.auth import get_user_model

User = get_user_model()

# Choose an organization (try id 11, else first, else create)
org = Organization.objects.filter(id=11).first() or Organization.objects.first()
if not org:
    org = Organization.objects.create(name='DemoOrg')

# Choose a user to set as created_by (optional)
user = User.objects.first()

# Prepare test data
pkg_kwargs = {
    'organization': org,
    'created_by': user,
    'title': 'Test Package - pricing persistence',
    'package_type': 'umrah',
    'status': 'active',
    'max_capacity': 10,
    # Visa
    'adault_visa_selling_price': 100.0,
    'adault_visa_purchase_price': 80.0,
    'child_visa_selling_price': 50.0,
    'child_visa_purchase_price': 30.0,
    'infant_visa_selling_price': 20.0,
    'infant_visa_purchase_price': 10.0,
    # Food / Ziyarat
    'food_selling_price': 200.0,
    'food_purchase_price': 150.0,
    'makkah_ziyarat_selling_price': 300.0,
    'makkah_ziyarat_purchase_price': 250.0,
    'madinah_ziyarat_selling_price': 280.0,
    'madinah_ziyarat_purchase_price': 230.0,
    # Transport
    'transport_selling_price': 400.0,
    'transport_purchase_price': 350.0,
}

print('Creating UmrahPackage with payload:')
for k, v in pkg_kwargs.items():
    if k in ['organization','created_by']:
        print(f'  {k}: {getattr(v, "id", None)}')
    else:
        print(f'  {k}: {v}')

with transaction.atomic():
    pkg = UmrahPackage.objects.create(**{k: v for k, v in pkg_kwargs.items() if v is not None})

    # Create a transport detail row (vehicle_type optional)
    UmrahPackageTransportDetails.objects.create(package=pkg, vehicle_type='suv')

print('\nCreated package id:', pkg.id)
# Reload pkg
pkg = UmrahPackage.objects.get(id=pkg.id)
print('\nPersisted values:')
fields_to_check = [
    'adault_visa_selling_price','adault_visa_purchase_price',
    'child_visa_selling_price','child_visa_purchase_price',
    'infant_visa_selling_price','infant_visa_purchase_price',
    'food_selling_price','food_purchase_price',
    'makkah_ziyarat_selling_price','makkah_ziyarat_purchase_price',
    'madinah_ziyarat_selling_price','madinah_ziyarat_purchase_price',
    'transport_selling_price','transport_purchase_price',
]
for f in fields_to_check:
    print(f, ':', getattr(pkg, f, None))

# Print DB columns for the package table
from django.db import connection
with connection.cursor() as c:
    c.execute("SHOW COLUMNS FROM packages_umrahpackage")
    cols = [r[0] for r in c.fetchall()]
print('\nDB columns (packages_umrahpackage) snapshot includes:')
for c in cols:
    if c in fields_to_check:
        print('  ', c)

print('\nTransport details created:', pkg.transport_details.count())
for t in pkg.transport_details.all():
    print('  transport id', t.id, 'vehicle_type', t.vehicle_type, 'transport_sector_id', getattr(t.transport_sector, 'id', None))
