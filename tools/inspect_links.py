import os
import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE','configuration.settings')

try:
    import django
    django.setup()
except Exception as e:
    print('Django setup error:', e)
    raise

from organization.models import OrganizationLink
try:
    from booking.models import AllowedReseller
except Exception:
    AllowedReseller = None

orgs = [11,12,13]
print('OrganizationLink rows involving orgs 11,12,13:')
qs = OrganizationLink.objects.filter(main_organization_id__in=orgs) | OrganizationLink.objects.filter(link_organization_id__in=orgs)
for l in qs.distinct():
    print('ID', l.id, 'Main', l.main_organization_id, 'Link', l.link_organization_id, 'MainReq', l.main_organization_request, 'LinkReq', l.link_organization_request, 'request_status', l.request_status)

if AllowedReseller is None:
    print('\nNo booking.AllowedReseller model available in this environment.')
else:
    print('\nAllowedReseller rows with reseller_company_id in 11,12,13:')
    ars = AllowedReseller.objects.filter(reseller_company_id__in=orgs)
    for ar in ars:
        inv = getattr(ar, 'inventory_owner_company', None)
        inv_org = None
        try:
            inv_org = getattr(inv, 'organization_id', None) or getattr(inv, 'main_organization_id', None)
        except Exception:
            inv_org = None
        print('ID', ar.id, 'reseller', getattr(ar,'reseller_company_id', None), 'inv_org', inv_org, 'allowed_types', getattr(ar,'allowed_types', None), 'allowed_items', getattr(ar,'allowed_items', None), 'requested_status_by_reseller', getattr(ar,'requested_status_by_reseller', None))
