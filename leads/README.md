# Leads Module — Lead Generation & Area Customer Management

This document describes the `leads` Django app implemented to manage local leads, follow-ups, loan commitments, and conversion tracking for branch customers.

## Overview

- Models: `Lead`, `FollowUpHistory`, `LoanCommitment`.
- Services: `LeadService.auto_create_from_booking(booking)` — auto-create or link leads when a Booking is created.
- Signals: `leads.signals.auto_create_lead_from_booking` — connected to `booking.Booking.post_save`.
- API endpoints under `/api/leads/` (create, list, detail, update, followup, loan-promise, search, convert, lost, followup/today, overdue-loans).
- RBAC: `IsBranchUser` permission ensures only branch users or org admins (or staff/superuser) can create/update leads.
- Management command: `mark_overdue_loans` — marks pending loan commitments past their promised date as `overdue`.

## Models

- Lead: stores customer info (name, passport, contact, CNIC, address), branch and organization, lead source/status, loan promise, next follow-up, conversion status, and link to a booking (`booking_id` stored as FK with `db_constraint=False` in dev to avoid ordering issues).
- FollowUpHistory: stores follow-up records linked to a Lead.
- LoanCommitment: stores promised payment dates and status.

Notes on DB constraints:
- For development, `booking` FKs use `db_constraint=False` to avoid migration ordering errors where the booking table may not be present when leads migrations run. In production you can remove `db_constraint=False` and ensure migration ordering or add explicit migration dependencies.

## API Endpoints

- POST `/api/leads/create/` — Create new lead (branch users only).
- GET `/api/leads/list/` — List leads (filters supported: `branch_id`, `lead_status`, `next_followup_date`).
- GET `/api/leads/detail/<id>/` — Lead details.
- PUT `/api/leads/update/<id>/` — Update lead (branch users only).
- POST `/api/leads/followup/` — Add follow-up record (branch users only).
- POST `/api/leads/loan-promise/` — Add/update loan commitment (branch users only).
- GET `/api/leads/search/?passport=...&contact=...` — Search lead by passport/contact.
- PUT `/api/leads/convert/<id>/` — Mark as converted (branch users only).
- PUT `/api/leads/lost/<id>/` — Mark as lost (branch users only).
- GET `/api/leads/followup/today/` — Today's pending follow-ups (branch users only).
- GET `/api/leads/overdue-loans/` — Overdue loan commitments (branch users only).

## Tests

Tests live in `leads/tests/`:

- `test_models.py` — model behavior, serializer validation, booking signal auto-create, and management command.
- `test_api.py` — API tests using DRF's `APITestCase` for RBAC, endpoints `create`, `convert`, `lost`, `followup/today`, `overdue-loans`.
- `test_commands.py` — tests for `mark_overdue_loans` management command.

Run tests:
```powershell
python manage.py test leads -v 2
```

## Management Commands

- `python manage.py mark_overdue_loans` — marks `LoanCommitment` with `promised_clear_date` < today and `status='pending'` as `overdue`.

## Logging

- Auto-create service and signals now log events and exceptions to the module logger. Check Django logging configuration to capture these logs.

## Next steps / Recommendations

1. Harden RBAC to check user↔branch relations directly if your user model stores branch membership (instead of relying on `is_staff` or a `role` string).
2. Add notification/reminder management command (daily) to send follow-up reminders for leads with `next_followup_date == today`.
3. For production, consider enabling DB-level FK constraints by removing `db_constraint=False` and adding explicit migration dependencies on the `booking` app.
4. Expand serializers to limit returned fields and add more API docs (DRF schema annotations).

## Contact
If you need me to extend tests or switch the FK strategy to strict DB constraints with migration dependencies, tell me which option you prefer and I'll implement it.
