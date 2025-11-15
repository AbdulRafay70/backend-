import os, sys, django
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()
from packages.models import UmrahPackage
pkg = UmrahPackage.objects.filter(id=35).first()
if not pkg:
    print('Package id=35 not found')
else:
    print('id=', pkg.id)
    print('transport_price=', pkg.transport_price)
    print('transport_selling_price=', pkg.transport_selling_price)
    print('transport_purchase_price=', pkg.transport_purchase_price)
    print('reselling_allowed=', pkg.reselling_allowed)
    print('available_start_date=', pkg.available_start_date)
    print('available_end_date=', pkg.available_end_date)
    print('area_agent_commission_adult=', pkg.area_agent_commission_adult)
    print('markup_percent=', pkg.markup_percent)
    print('tax_rate=', pkg.tax_rate)
