import os, sys, django, json, datetime, requests
# ensure project root is on sys.path so Django settings module can be imported
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE','configuration.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
username='devadmin'
password='DevAdminPass123!'
email='dev@local'
try:
    user = User.objects.get(username=username)
    print('User exists:', username)
except User.DoesNotExist:
    user = User.objects.create_superuser(username=username, email=email, password=password)
    print('Created superuser:', username)

# Obtain JWT token
token_url='http://127.0.0.1:8000/api/token/'
resp = requests.post(token_url, json={'username':username,'password':password})
print('token status', resp.status_code)
try:
    tokens = resp.json()
    print(json.dumps(tokens, indent=2))
except Exception as e:
    print('token response text', resp.text)
    tokens=None

if not tokens or 'access' not in tokens:
    print('Failed to obtain token, aborting')
else:
    access = tokens['access']
    # Now post hotel using access token
    url='http://127.0.0.1:8000/api/hotels/'
    payload={
     'name':'FrontendAuthenticatedTest',
     'address':'addr',
     'organization':32,
     'city':22,
     'contact_number':'+923001234567',
    'category':'economy',
     'distance':0,
     'is_active':True,
     'available_start_date': str(datetime.date.today()),
     'available_end_date': str(datetime.date.today()+datetime.timedelta(days=1)),
     'prices':[{'start_date':str(datetime.date.today()),'end_date':str(datetime.date.today()+datetime.timedelta(days=1)),'room_type':'single','price':100}],
     'contact_details':[{'contact_person':'Reception','contact_number':'+923001234567'}]
    }
    headers={'Authorization':f'Bearer {access}'}
    r = requests.post(url, json=payload, headers=headers)
    print('POST status', r.status_code)
    try:
        print('POST JSON:', json.dumps(r.json(), indent=2))
    except Exception as e:
        print('POST text:', r.text)
