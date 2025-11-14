"""
Script to authenticate with SimpleJWT (/api/token/) and create a Ticket via the API.
Run from project root (where manage.py lives). Requires `requests`.

Usage (PowerShell):
    python scripts\create_ticket_via_api.py

It will:
 - POST /api/token/ with provided username/password
 - POST /api/tickets/ with a minimal ticket payload
 - GET /api/tickets/?organization=<orgId> and print returned tickets

Adjust organization/airline/origin/destination ids in the PAYLOAD below if needed.
"""

import requests
import os
import sys
import json
from datetime import datetime, timedelta

BASE = os.environ.get('API_BASE', 'http://127.0.0.1:8000')
TOKEN_URL = f"{BASE}/api/token/"
TICKETS_URL = f"{BASE}/api/tickets/"

# Credentials (replace or keep as provided) - DO NOT commit real credentials to VCS
USERNAME = 'abdulrafay@gmail.com'
PASSWORD = 'hyd12233'

# Minimal payload - adjust ids to match your DB
ORG_ID = 8
AIRLINE_ID = 15
ORIGIN_ID = 17
DEST_ID = 17

# Build a trip detail for tomorrow
now = datetime.now()
dep_dt = (now + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0).isoformat()
arr_dt = (now + timedelta(days=1)).replace(hour=12, minute=0, second=0, microsecond=0).isoformat()

PAYLOAD = {
    "organization": ORG_ID,
    "airline": AIRLINE_ID,
    "origin": ORIGIN_ID,
    "destination": DEST_ID,
    # you can omit flight_number to let model auto-generate
    "flight_number": "",
    "pnr": "N/A",
    "adult_price": 14000.0,
    "child_price": 100000.0,
    "infant_price": 12000.0,
    "adult_buy_price": 12000.0,
    "child_buy_price": 90000.0,
    "infant_buy_price": 10000.0,
    "weight": 30.0,
    "pieces": 2,
    "total_seats": 30,
    "left_seats": 30,
    "status": "available",
    "is_refundable": True,
    "is_meal_included": True,
    "is_umrah_seat": True,
    "trip_type": "One-way",
    "departure_stay_type": "Non-Stop",
    "return_stay_type": "Non-Stop",
    # Nested trip_details list
    "trip_details": [
        {
            "departure_date_time": dep_dt,
            "arrival_date_time": arr_dt,
            "trip_type": "Departure",
            "departure_city": ORIGIN_ID,
            "arrival_city": DEST_ID,
        }
    ]
}


def obtain_token(username, password):
    data = {"username": username, "password": password}
    print("Logging in to", TOKEN_URL)
    r = requests.post(TOKEN_URL, json=data)
    if r.status_code != 200:
        print("Login failed:", r.status_code, r.text)
        return None
    j = r.json()
    token = j.get('access')
    if not token:
        print('No access token in response:', j)
        return None
    return token


def create_ticket(token, payload):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("Creating ticket at", TICKETS_URL)
    r = requests.post(TICKETS_URL, json=payload, headers=headers)
    print("Status:", r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
    return r


def list_tickets(token, org_id=None):
    headers = {"Authorization": f"Bearer {token}" } if token else {}
    url = TICKETS_URL
    if org_id:
        url = f"{TICKETS_URL}?organization={org_id}"
    print('Fetching', url)
    r = requests.get(url, headers=headers)
    print('Status:', r.status_code)
    try:
        data = r.json()
        print(json.dumps(data, indent=2, default=str)[:2000])
    except Exception:
        print(r.text[:2000])
    return r


if __name__ == '__main__':
    token = obtain_token(USERNAME, PASSWORD)
    if not token:
        sys.exit(1)

    # Create ticket
    create_resp = create_ticket(token, PAYLOAD)

    # List tickets for org
    list_tickets(token, ORG_ID)

    print('\nDone. Now open the admin Ticket Bookings page and refresh to see the new ticket.')
