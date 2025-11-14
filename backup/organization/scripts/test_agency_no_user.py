from organization.serializers import AgencySerializer
from organization.models import Organization, Branch
org = Organization.objects.create(name='OrgY')
branch = Branch.objects.create(organization=org, name='MainY')
payload = {
    'branch': branch.id,
    'name': 'AgencyY',
    'agency_type': 'Area Agency',
    'credit_limit': '20000.00',
    'credit_limit_days': 15,
    'user': [],
}
ser = AgencySerializer(data=payload)
print('valid?', ser.is_valid(), ser.errors)
if ser.is_valid():
    a = ser.save()
    """
    Script removed per request.
    """
import sys
sys.exit(0)
