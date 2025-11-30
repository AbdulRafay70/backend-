import os
import sys
import django

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

qs = UmrahPackage.objects.filter(organization_id=13)[:5]
print('count:', qs.count())
for p in qs:
    # Access some fields and related fields to ensure DB columns are present
    print(p.id, getattr(p, 'price_per_person', None))
print('Query executed successfully')
