# Unpaid Orders API — Implementation & Usage

**Date:** 2025-10-28

## Overview
This document describes the implementation and usage of the Unpaid Orders API endpoint for bookings.

---

## Endpoint

**GET** `/api/bookings/unpaid/<organization_id>/`

Fetches all active, unpaid bookings for a given organization (and its users/agents/clients), where:
- The booking is not expired (`expiry_time >= now`)
- The booking status is `unpaid`
- The pending balance (`total_amount - paid_payment`) is greater than zero

---

## Logic & Filters
- **Status:** Only bookings with `status = 'unpaid'`
- **Pending Balance:** Only bookings where `pending_payment > 0`
- **Not Expired:** Only bookings where `expiry_time >= current_date_time`
- **Organization:** Bookings for the given `organization_id` and its users/agents

---

## Response Format
Returns JSON:

```
{
  "total_unpaid": <count>,
  "unpaid_bookings": [
    {
      "booking_id": ...,
      "booking_no": "...",
      "customer_name": "...",
      "contact_number": "...",
      "total_amount": ...,
      "paid_payment": ...,
      "pending_payment": ...,
      "expiry_time": "...",
      "agent_id": ...,
      "status": "unpaid",
      "call_status": ...,
      "client_note": ...
    }
    // ...more bookings
  ]
}
```

---

## Required Fields per Booking
- `booking_id`: Booking unique ID
- `booking_no`: Booking number (e.g. INV-101)
- `customer_name`: Passenger/client name (from first BookingPersonDetail)
- `contact_number`: Customer’s contact number (from first BookingPersonDetail)
- `total_amount`: Total booking cost
- `paid_payment`: Sum of all payments made (calculated)
- `pending_payment`: Remaining balance (total - paid)
- `expiry_time`: When this unpaid booking expires
- `agent_id`: User ID who created the booking
- `status`: Always 'unpaid'
- `call_status`: Boolean (follow-up call done or not)
- `client_note`: Agent’s remark (optional)

---

## Example Usage

```
GET /api/bookings/unpaid/123/
```

Response:
```
{
  "total_unpaid": 2,
  "unpaid_bookings": [
    {
      "booking_id": 101,
      "booking_no": "INV-101",
      "customer_name": "Ali Raza",
      "contact_number": "+92-300000000",
      "total_amount": 250000,
      "paid_payment": 50000,
      "pending_payment": 200000,
      "expiry_time": "2025-09-30T23:59:00Z",
      "agent_id": 12,
      "status": "unpaid",
      "call_status": false,
      "client_note": null
    },
    {
      "booking_id": 102,
      "booking_no": "INV-102",
      "customer_name": "Fatima",
      "contact_number": "+92-300111111",
      "total_amount": 180000,
      "paid_payment": 0,
      "pending_payment": 180000,
      "expiry_time": "2025-09-28T23:59:00Z",
      "agent_id": 15,
      "status": "unpaid",
      "call_status": true,
      "client_note": "Customer will pay tomorrow"
    }
  ]
}
```

---

## Test Coverage
- Automated test verifies:
  - Only unpaid, not expired, and pending bookings are returned
  - All required fields are present
  - Edge cases (no results, expired bookings, fully paid bookings) are handled

---

## Auth
- JWT authentication required (see project settings)

---

## File: `docs/unpaid_orders_api.md`
