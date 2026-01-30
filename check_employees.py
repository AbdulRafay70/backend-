import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.views import EmployeeViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model

def verify():
    print("--- Verifying Employee Endpoint ---")
    User = get_user_model()
    user = User.objects.first()
    if not user:
        print("No user found, creating mock")
        user = User.objects.create(username='empmock', is_superuser=True)

    factory = APIRequestFactory()
    request = factory.get('/api/employees/')
    force_authenticate(request, user=user)
    
    view = EmployeeViewSet.as_view({'get': 'list'})
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("SUCCESS: Endpoint returned 200 OK")
        print(f"Count: {len(response.data.get('results', response.data))}")
    else:
        print(f"FAILURE: Status {response.status_code}")
        print(response.data)

if __name__ == '__main__':
    verify()
