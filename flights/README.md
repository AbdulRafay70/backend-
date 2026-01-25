# AIQS Flight API Integration

This module provides integration with the AIQS Flight Booking API for searching and managing flight bookings.

## Features

- ✅ Flight search via WebSocket
- ✅ Authentication with token caching
- ✅ RESTful API endpoints for frontend
- ✅ Automatic token refresh
- ✅ Comprehensive error handling

## API Endpoints

### 1. Search Flights
**POST** `/api/flights/search/`

Search for available flights between two airports.

**Request Body:**
```json
{
  "origin": "KHI",
  "destination": "DXB",
  "departureDate": "10-02-2026",
  "adults": 1,
  "children": 0,
  "infants": 0,
  "cabinClass": "Y",
  "nonStop": false,
  "preferredAirlines": [],
  "maxResults": 50
}
```

**Response:**
```json
{
  "flights": [
    {
      "id": "1",
      "refundable": true,
      "fare": {
        "baseFare": 20330.00,
        "tax": 35175.00,
        "total": 55505.00,
        "currency": "PKR"
      },
      "segments": [...]
    }
  ],
  "total_count": 43,
  "request_count": 3
}
```

### 2. Test Authentication
**GET** `/api/flights/auth/test/`

Test the AIQS API authentication.

### 3. Clear Auth Cache
**POST** `/api/flights/auth/clear-cache/`

Clear cached authentication tokens (admin only).

## Configuration

Update credentials in `flights/config.py`:

```python
AUTHENTICATE_ENDPOINT = "https://pp-auth-api.aiqs.link/auth/cognito"
WSS_ENDPOINT = "wss://pp-api.aiqs.link"
REST_ENDPOINT = "https://pp-api.aiqs.link"
CLIENT_ID = "your_client_id"
USERNAME = "your_username"
PASSWORD = "your_password"
```

## Usage in Views

```python
from flights.flight_service import FlightService
import asyncio

# Search flights
search_params = {
    "origin": "KHI",
    "destination": "DXB",
    "departureDate": "10-02-2026",
    "adults": 1,
    "children": 0,
    "infants": 0,
    "cabinClass": "Y"
}

loop = asyncio.new_event_loop()
results = loop.run_until_complete(
    FlightService.search_flights(search_params)
)
parsed = FlightService.parse_search_results(results)
```

## Cabin Classes

- `Y` - Economy
- `C` - Business  
- `F` - First Class
- `W` - Premium Economy
- `M` - Economy Premium

## Airport Codes

Use 3-letter IATA codes:
- KHI - Karachi
- DXB - Dubai
- LHR - London Heathrow
- JFK - New York JFK
- etc.

## Date Format

Dates must be in `DD-MM-YYYY` format (e.g., "10-02-2026").

## Dependencies

```bash
pip install djangorestframework
pip install websockets
pip install drf-yasg  # for API documentation
```
