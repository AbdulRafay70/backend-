import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import Airlines

org_id = 11
qs = Airlines.objects.filter(organization_id=org_id)
print('organization_id=', org_id)
print('count=', qs.count())
print(json.dumps(list(qs.values('id', 'name', 'code', 'organization_id')), default=str, indent=2))

# Print a few sample airlines
for a in qs[:10]:
    print('AIRLINE:', a.id, a.name, a.code, 'org=', getattr(a, 'organization_id', None))
