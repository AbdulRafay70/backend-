#!/usr/bin/env python3
"""
Dump all tickets with detailed fields (trip_details and stopover_details) as JSON.
Run from repository root:
  python scripts/dump_all_tickets.py
"""
import os
import sys
import json

# Setup django
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

import django
django.setup()

from tickets.models import Ticket
from tickets.models import TicketTripDetails, TickerStopoverDetails

out = []
for t in Ticket.objects.all().order_by('id'):
    try:
        item = {
            'id': t.id,
            'flight_number': t.flight_number,
            'pnr': t.pnr,
            'airline': getattr(t.airline, 'name', None),
            'airline_id': getattr(t.airline, 'id', None),
            'organization': getattr(t.organization, 'name', None),
            'organization_id': getattr(t.organization, 'id', None),
            'branch_id': getattr(t.branch, 'id', None),
            'origin': getattr(t.origin, 'name', None),
            'origin_id': getattr(t.origin, 'id', None),
            'destination': getattr(t.destination, 'name', None),
            'destination_id': getattr(t.destination, 'id', None),
            'departure_date': str(t.departure_date) if t.departure_date else None,
            'departure_time': str(t.departure_time) if t.departure_time else None,
            'arrival_date': str(t.arrival_date) if t.arrival_date else None,
            'arrival_time': str(t.arrival_time) if t.arrival_time else None,
            'seat_type': t.seat_type,
            'adult_fare': t.adult_fare,
            'child_fare': t.child_fare,
            'infant_fare': t.infant_fare,
            'adult_buy_price': getattr(t, 'adult_buy_price', None),
            'child_buy_price': getattr(t, 'child_buy_price', None),
            'infant_buy_price': getattr(t, 'infant_buy_price', None),
            'adult_price': getattr(t, 'adult_price', None),
            'child_price': getattr(t, 'child_price', None),
            'infant_price': getattr(t, 'infant_price', None),
            'weight': getattr(t, 'weight', None),
            'pieces': getattr(t, 'pieces', None),
            'is_meal_included': t.is_meal_included,
            'is_refundable': t.is_refundable,
            'refund_rule': t.refund_rule,
            'is_umrah_seat': t.is_umrah_seat,
            'status': t.status,
            'total_seats': t.total_seats,
            'left_seats': t.left_seats,
            'booked_tickets': t.booked_tickets,
            'confirmed_tickets': t.confirmed_tickets,
            'created_at': t.created_at.isoformat() if getattr(t, 'created_at', None) else None,
        }

        # trip details
        trips = []
        for d in t.trip_details.all().order_by('departure_date_time'):
            trips.append({
                'id': d.id,OST http://127.0.0.1:8000/api/tickets/?organization=8 400 (Bad Request)
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
_request @ Axios.js:187
request @ Axios.js:40
httpMethod @ Axios.js:226
wrap @ bind.js:5
submitForm @ AddTicket.jsx:425
handleSave @ AddTicket.jsx:482
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
AddTicket.jsx:469  API Error: AxiosError {message: 'Request failed with status code 400', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
submitForm @ AddTicket.jsx:469
await in submitForm
handleSave @ AddTicket.jsx:482
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
AddTicket.jsx:425   POST http://127.0.0.1:8000/api/tickets/?organization=8 400 (Bad Request)
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
_request @ Axios.js:187
request @ Axios.js:40
httpMethod @ Axios.js:226
wrap @ bind.js:5
submitForm @ AddTicket.jsx:425
handleSave @ AddTicket.jsx:482
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
AddTicket.jsx:469  API Error: AxiosError {message: 'Request failed with status code 400', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
submitForm @ AddTicket.jsx:469
await in submitForm
handleSave @ AddTicket.jsx:482
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
                'trip_type': d.trip_type,
                'departure_date_time': d.departure_date_time.isoformat() if d.departure_date_time else None,
                'arrival_date_time': d.arrival_date_time.isoformat() if d.arrival_date_time else None,
                'departure_city': getattr(d.departure_city, 'name', None),
                'departure_city_id': getattr(d.departure_city, 'id', None),
                'arrival_city': getattr(d.arrival_city, 'name', None),
                'arrival_city_id': getattr(d.arrival_city, 'id', None),
            })
        item['trip_details'] = trips

        # stopover details
        stops = []
        for s in t.stopover_details.all():
            stops.append({
                'id': s.id,
                'trip_type': s.trip_type,
                'stopover_duration': s.stopover_duration,
                'stopover_city': getattr(s.stopover_city, 'name', None),
                'stopover_city_id': getattr(s.stopover_city, 'id', None),
            })
        item['stopover_details'] = stops

        out.append(item)
    except Exception as e:
        out.append({'id': getattr(t, 'id', None), 'error': str(e)})

print(json.dumps(out, indent=2, ensure_ascii=False))
