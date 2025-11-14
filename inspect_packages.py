import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','configuration.settings')
django.setup()
from packages.models import UmrahPackage
pids=[11,13,12]
for pid in pids:
    try:
        p=UmrahPackage.objects.get(id=pid)
        print('id',p.id,'title',p.title,'org',p.organization_id,'is_active',p.is_active,'is_public',p.is_public,'reselling_allowed',p.reselling_allowed,'inventory_owner_organization_id',p.inventory_owner_organization_id)
        print(' hotel_details count',p.hotel_details.count(),'ticket_details count',p.ticket_details.count())
    except Exception as e:
        print('id',pid,'error',e)
