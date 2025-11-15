import os
import sys
import django

# add project root to path so Django settings package can be imported
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# configure Django environment for standalone script
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import ResellRequest

qs = ResellRequest.objects.filter(main_organization_id=11, link_organization_id=13).order_by('id')
for r in qs:
    print(r.id, r.reseller, r.status, r.updated_at.isoformat())
