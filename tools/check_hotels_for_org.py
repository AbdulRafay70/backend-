import os, sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE','configuration.settings')

import django
from django.db.models import Q
django.setup()

from tickets.models import Hotels
from organization.models import OrganizationLink
from booking.models import AllowedReseller

ORG=13

print('Simulating HotelsViewSet.get_queryset for organization', ORG)

# Superuser case not relevant

linked_org_ids = OrganizationLink.get_linked_organizations(ORG)
print('linked_org_ids:', linked_org_ids)

allowed_owner_org_ids = []
allowed_hotel_ids = set()
try:
    allowed_qs = AllowedReseller.objects.filter(reseller_company_id=ORG, requested_status_by_reseller='ACCEPTED')
    for ar in allowed_qs:
        inv = getattr(ar, 'inventory_owner_company', None)
        if inv is None:
            continue
        org_id = getattr(inv, 'organization_id', None) or getattr(inv, 'main_organization_id', None) or None
        if not org_id:
            continue
        # check active link
        active = OrganizationLink.objects.filter(
            (Q(main_organization_id=org_id) & Q(link_organization_id=ORG)) |
            (Q(main_organization_id=ORG) & Q(link_organization_id=org_id)),
            request_status=True,
        ).exists()
        if not active:
            continue
        items = getattr(ar, 'allowed_items', None) or []
        if items:
            for it in items:
                try:
                    if (it.get('type')=='hotel') and it.get('id'):
                        allowed_hotel_ids.add(int(it.get('id')))
                except Exception:
                    pass
        else:
            types = ar.allowed_types or []
            if 'GROUP_HOTELS' in types or 'HOTELS' in types:
                allowed_owner_org_ids.append(org_id)
except Exception:
    pass

print('allowed_owner_org_ids:', allowed_owner_org_ids)
print('allowed_hotel_ids:', allowed_hotel_ids)

# Build queryset per current logic
own_org_id = ORG
from tickets.models import Hotels
queryset = Hotels.objects.filter(is_active=True)
hotel_field_names = [f.name for f in Hotels._meta.get_fields()]
has_owner_field = 'owner_organization_id' in hotel_field_names

base_filter = Q(organization_id=own_org_id)
allowed_owners_filter = Q(organization_id__in=allowed_owner_org_ids)
if has_owner_field:
    allowed_owners_filter = allowed_owners_filter | Q(owner_organization_id__in=allowed_owner_org_ids)

linked_org_ids_only = linked_org_ids - {own_org_id}
org_check = Q(organization_id__in=linked_org_ids_only)
if has_owner_field:
    org_check = org_check | Q(owner_organization_id__in=linked_org_ids_only)
linked_filter = org_check & Q(reselling_allowed=True)

final_filter = base_filter | allowed_owners_filter | linked_filter | Q(id__in=list(allowed_hotel_ids))

qs = queryset.filter(final_filter).distinct().prefetch_related('prices')
print('Result count:', qs.count())
for h in qs:
    print('Hotel id', h.id, 'org', h.organization_id, 'reselling_allowed', h.reselling_allowed)
