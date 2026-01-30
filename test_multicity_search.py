import json
import sys

try:
    import requests
except Exception as e:
    print("requests not installed. Install with: pip install requests")
    sys.exit(1)

url = "http://127.0.0.1:8000/api/flights/search/"
headers = {"Content-Type": "application/json"}

payloads = [
    {
        "name": "DOH->KWI->KHI->LHR",
        "body": {
            "adults": 1,
            "children": 0,
            "infants": 0,
            "cabinClass": "Y",
            "tripType": "multicity",
            "multiCitySegments": [
                {"origin": "DOH", "destination": "KWI", "departureDate": "06-02-2026"},
                {"origin": "KWI", "destination": "KHI", "departureDate": "10-02-2026"},
                {"origin": "KHI", "destination": "LHR", "departureDate": "15-02-2026"}
            ]
        }
    },
    {
        "name": "DXB->KWI->DOH->MXP",
        "body": {
            "adults": 1,
            "children": 0,
            "infants": 0,
            "cabinClass": "Y",
            "tripType": "multicity",
            "multiCitySegments": [
                {"origin": "DXB", "destination": "KWI", "departureDate": "06-02-2026"},
                {"origin": "KWI", "destination": "DOH", "departureDate": "10-02-2026"},
                {"origin": "DOH", "destination": "MXP", "departureDate": "16-02-2026"}
            ]
        }
    }
]

for p in payloads:
    print('\n=== TEST:', p['name'], '===')
    print('POST', url)
    print('Request payload:')
    print(json.dumps(p['body'], indent=2))
    try:
        resp = requests.post(url, headers=headers, json=p['body'], timeout=120)
        print('\nStatus:', resp.status_code)
        try:
            print(json.dumps(resp.json(), indent=2))
        except Exception:
            print(resp.text)
    except Exception as e:
        print('Request failed:', str(e))
