import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','configuration.settings')
django.setup()
from packages.models import UmrahPackage
qs=UmrahPackage.objects.filter(organization_id=8).order_by('id')
print('Found',qs.count(),'packages for org 8')
for p in qs:
    print(p.id,p.title,p.is_public,p.available_start_date)
