import requests
url='https://api.saer.pk/api/umrah-packages/13/?organization=8'
try:
    r=requests.get(url, timeout=5)
    print('status',r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
except Exception as e:
    print('error',e)
