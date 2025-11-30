import requests

base = 'http://127.0.0.1:8000'
paths = [
    '/api/food-prices/?organization=11',
    '/api/ziarat-prices/?organization=11',
    '/api/only-visa-prices/?organization=11',
]

for p in paths:
    try:
        r = requests.get(base + p, timeout=10)
        print(p, r.status_code, len(r.content))
        print(r.text[:400])
    except Exception as e:
        print(p, 'ERROR', e)
