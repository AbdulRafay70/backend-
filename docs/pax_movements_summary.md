# Pax Movements & Registration Rules API — Implementation Summary

**Date:** 2025-10-28

## Overview
This document summarizes the implementation of the pax_movements (passenger movement tracking) and registration rules APIs, including endpoints, models, admin, and test coverage.

---

## PaxMovement API

### Model: `PaxMovement`
- Tracks passenger entry/exit, flight updates, and status reporting.
- **Fields:**
  - `id`: AutoField (PK)
  - `pax_id`: string (linked to booking/passenger)
  - `flight_no`: string
  - `departure_airport`, `arrival_airport`: string
  - `departure_time`, `arrival_time`: datetime
  - `status`: in_pakistan, entered_ksa, in_ksa, exited_ksa, exit_pending
  - `verified_exit`: bool
  - `agent_id`: string
  - `reported_to_shirka`: bool
  - `created_at`, `updated_at`: datetime

### Endpoints
- `POST /api/universal/pax-movements/` — Create new pax movement
- `GET /api/universal/pax-movements/` — List all pax movements
- `GET /api/universal/pax-movements/{id}/` — Retrieve details
- `PATCH /api/universal/pax-movements/{id}/` — Update details
- `GET /api/universal/pax-movements/{id}/status/` — Get status/verified_exit
- `GET /api/universal/pax-movements/summary/` — Get summary counts (by status, by city)
- `POST /api/universal/pax-movements/{id}/verify_exit/` — Mark as exited/verified
- `POST /api/universal/pax-movements/{id}/notify_agent/` — Notify agent to update flight info

### Admin
- Registered in Django admin with list display, search, and filter.

### Tests
- CRUD (create, update, retrieve, delete)
- Status endpoint
- Summary endpoint
- Verify exit
- Notify agent
  - **Integration:** PaxMovement is now auto-created when a booking is created (checkpoint logic in BookingViewSet.create).
  - **NEW:** PaxMovement is also auto-created or updated when a booking is marked as paid (payment checkpoint logic in PaymentViewSet.create). This ensures full compliance with the Intimation API flow and client requirements.

---

## RegistrationRule API

### Model: `RegistrationRule`
- Dynamic requirements/benefits table for registration types.
- **Fields:**
  - `id`: AutoField (PK)
  - `type`: organization, branch, agent, employee
  - `requirement_text`, `benefit_text`: string
  - `city_needed`, `service_allowed`, `post_available`: string (optional)
  - `created_at`, `updated_at`: datetime

### Endpoints
- `POST /api/universal/registration-rules/` — Create rule
- `GET /api/universal/registration-rules/` — List rules
- `GET /api/universal/registration-rules/{id}/` — Retrieve rule
- `PUT /api/universal/registration-rules/{id}/` — Update rule
- `DELETE /api/universal/registration-rules/{id}/` — Delete rule

### Admin
- Registered in Django admin with list display, search, and filter.

### Tests
- CRUD (create, update, retrieve, delete)
- Filtering

---

## OpenAPI / Swagger
- All endpoints are documented in `My API (2).yaml`.
- Example requests and responses included for both models.

---

## How to run tests
```powershell
python manage.py test universal
```

## Next steps
- Expand OpenAPI with more examples and parameter docs.
- Add async notifications for pax_movements.
- Add more test cases for edge conditions and permissions.

---

File: `docs/pax_movements_summary.md`