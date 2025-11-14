from organization.serializers import AgencySerializer
from organization.models import Organization, Branch
from django.contrib.auth import get_user_model
User = get_user_model()
org = Organization.objects.create(name='OrgX')
branch = Branch.objects.create(organization=org, name='Main')
user = User.objects.create(username='u_test')
payload = {
    'branch': branch.id,
    'name': 'AgencyX',
    'agency_type': 'Full Agency',
    'credit_limit': '50000.00',
    'credit_limit_days': 30,
    'assign_to': user.id,
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
