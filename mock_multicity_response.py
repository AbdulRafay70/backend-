import json
from datetime import datetime, timedelta

# Sample multicity request (3 segments)
request_payload = {
    "adults": 1,
    "children": 0,
    "infants": 0,
    "cabinClass": "Y",
    "tripType": "multicity",
    "multiCitySegments": [
        {"origin": "DOH", "destination": "KWI", "departureDate": "05-02-2026"},
        {"origin": "KWI", "destination": "KHI", "departureDate": "07-02-2026"},
        {"origin": "KHI", "destination": "LHR", "departureDate": "10-02-2026"}
    ]
}

# Helper to build a flight entry for a segment
def build_segment_flight(origin, destination, dep_date_str, airline='QTR', flight_no='QA123', base=200.0, tax=50.0, currency='USD'):
    # Convert date strings for times
    dep_date = datetime.strptime(dep_date_str, '%d-%m-%Y')
    arr_date = dep_date + timedelta(hours=3)
    return {
        'departureDate': dep_date.strftime('%d-%m-%Y'),
        'departureTime': dep_date.strftime('%H:%M') if dep_date.hour else '09:00',
        'arrivalDate': arr_date.strftime('%d-%m-%Y'),
        'arrivalTime': '12:00',
        'departureLocation': origin,
        'arrivalLocation': destination,
        'airlineCode': airline,
        'operatingAirline': airline,
        'flightNo': flight_no,
        'equipmentType': '320',
        'duration': '03:00',
        'cabin': 'Y',
        'stops': 0,
        'seatsAvailable': 9,
        'baggage': [{'type': 'Checked', 'allowance': '23kg'}]
    }

# Build segments list
segments = []
for seg in request_payload['multiCitySegments']:
    fl = build_segment_flight(seg['origin'], seg['destination'], seg['departureDate'])
    segment = {
        'ond': {
            'duration': fl['duration'],
            'issuingAirline': fl['airlineCode'],
            'ondID': 0
        },
        'flights': [fl]
    }
    segments.append(segment)

# Single combined flight (itinerary) comprised of the segments
flight_item = {
    'id': 'MC-001',
    'refundable': False,
    'instantTicketing': True,
    'bookOnHold': False,
    'fare': {
        'baseFare': sum([200.0 for _ in segments]),
        'tax': sum([50.0 for _ in segments]),
        'total': sum([200.0 for _ in segments]) + sum([50.0 for _ in segments]),
        'currency': 'USD'
    },
    'fareDetails': {},
    'segments': segments,
    'supplierCode': 11,
    'supplierSpecific': {'traceId': 'TRACE123'},
    'brandedFareSupported': False,
    'rawData': {}
}

response = {
    'flights': [flight_item],
    'total_count': 1,
    'request_count': 1
}

print(json.dumps({'request_payload': request_payload, 'response': response}, indent=2))
