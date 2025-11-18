import os, sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','configuration.settings')

import django
from django.db.models import Q
django.setup()

from booking.models import AllowedReseller
from organization.models import OrganizationLink, ResellRequest

print('Starting cleanup of AllowedReseller and ResellRequest entries not backed by active links')

ar_qs = AllowedReseller.objects.all()
removed_ar = 0
for ar in ar_qs:
    reseller_id = getattr(ar, 'reseller_company_id', None)
    inv = getattr(ar, 'inventory_owner_company', None)
    inv_org = None
    try:
        inv_org = getattr(inv, 'organization_id', None) or getattr(inv, 'main_organization_id', None)
    except Exception:
        inv_org = None
    if not reseller_id or not inv_org:
        continue
    # check active link
    active = OrganizationLink.objects.filter(
        (Q(main_organization_id=reseller_id) & Q(link_organization_id=inv_org)) |
        (Q(main_organization_id=inv_org) & Q(link_organization_id=reseller_id)),
        request_status=True,
    ).exists()
    if not active:
        print(f'Deleting AllowedReseller id={ar.id} reseller={reseller_id} inv_org={inv_org} (no active link)')
        ar.delete()
        removed_ar += 1

rr_qs = ResellRequest.objects.all()
removed_rr = 0
for rr in rr_qs:
    main = getattr(rr, 'main_organization_id', None)
    link = getattr(rr, 'link_organization_id', None)
    if not main or not link:
        continue
    active = OrganizationLink.objects.filter(
        (Q(main_organization_id=main) & Q(link_organization_id=link)) |
        (Q(main_organization_id=link) & Q(link_organization_id=main)),
        request_status=True,
    ).exists()
    if not active:
        print(f'Deleting ResellRequest id={rr.id} main={main} link={link} (no active link)')
        rr.delete()
        removed_rr += 1

print('Cleanup complete. Removed AllowedReseller:', removed_ar, 'Removed ResellRequest:', removed_rr)
