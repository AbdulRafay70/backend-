import os
import sys
import django

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(ROOT)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

django.setup()
from packages.serializers import UmrahPackageSerializer
from organization.models import Organization
from django.contrib.auth import get_user_model

User = get_user_model()
org = Organization.objects.filter(id=11).first() or Organization.objects.first()
user = User.objects.first()

data = {
    'organization': org.id if org else None,
    'created_by': user.id if user else None,
    'title': 'Serializer Test Package',
    'package_type': 'umrah',
    'status': 'active',
    'max_capacity': 20,
    'adault_visa_purchase_price': 123.0,
    'child_visa_purchase_price': 45.0,
    'infant_visa_purchase_price': 12.0,
    'food_purchase_price': 150.0,
    'makkah_ziyarat_purchase_price': 250.0,
    'madinah_ziyarat_purchase_price': 230.0,
    'transport_purchase_price': 350.0,
}

print('Attempting serializer create with data keys:', list(data.keys()))
ser = UmrahPackageSerializer(data=data)
if ser.is_valid():
    pkg = ser.save()
    print('Created package id via serializer:', pkg.id)
    for k in ['adault_visa_purchase_price','food_purchase_price','makkah_ziyarat_purchase_price','madinah_ziyarat_purchase_price','transport_purchase_price']:
        print(k, getattr(pkg, k, None))
else:
    print('Serializer errors:', ser.errors)
