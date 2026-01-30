import json
import requests

url = "http://127.0.0.1:8000/api/flights/search/"
headers = {"Content-Type": "application/json"}

legs = [
    {"origin": "KHI", "destination": "DXB", "departureDate": "10-02-2026"},
    {"origin": "DXB", "destination": "KWI", "departureDate": "14-02-2026"}
]

for i, leg in enumerate(legs, 1):
    payload = {
        "adults": 1,
        "children": 0,
        "infants": 0,
        "cabinClass": "Y",
        "tripType": "oneway",
        "origin": leg['origin'],
        "destination": leg['destination'],
        "departureDate": leg['departureDate']
    }
    print(f"\n--- Leg {i}: {leg['origin']} -> {leg['destination']} on {leg['departureDate']} ---")
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=120)
        print('Status:', resp.status_code)
        try:
            data = resp.json()
            print(json.dumps(data, indent=2))
        except Exception:
            print(resp.text)
    except Exception as e:
        print('Request failed:', str(e))
