from organization.serializers import AgencySerializer
from organization.models import Organization, Branch
from django.contrib.auth import get_user_model
User = get_user_model()
org = Organization.objects.create(name='OrgZ')
branch = Branch.objects.create(organization=org, name='MainZ')
# create a real user via create_user
user = User.objects.create_user(username='u_test2', password='pass')
payload = {
    'branch': branch.id,
    'name': 'AgencyZ',
    'agency_type': 'Full Agency',
    'credit_limit': '75000.00',
    'credit_limit_days': 45,
    'user': [user.id],
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
