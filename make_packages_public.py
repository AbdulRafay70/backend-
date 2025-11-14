import os
import django
from datetime import date
os.environ.setdefault('DJANGO_SETTINGS_MODULE','configuration.settings')
django.setup()
from packages.models import UmrahPackage
pids=[11,12,13]
for pid in pids:
    try:
        p=UmrahPackage.objects.get(id=pid)
        p.is_public=True
        p.available_start_date=date.today()
        p.available_end_date=date(2099,12,31)
        p.save()
        print('Updated',p.id,p.title,'is_public',p.is_public,p.available_start_date)
    except Exception as e:
        print('error',pid,e)
