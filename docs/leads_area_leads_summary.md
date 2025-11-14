# Lead Modules Summary (leads & area_leads)

This document summarizes the work created for the Lead Generation & Area Customer Management features.
It covers what was added, where to find it, how to run migrations/tests, endpoints, and recommended next steps.

---

## High-level overview

- Two apps were added/extended to handle branch-level and organization-level lead flows:
  - `leads` — existing app extended with a full Lead model, follow-ups and loan commitments, services and signals to auto-create or link leads from `Booking`.
  - `area_leads` — new app that stores branch-level leads, follow-ups, conversation logs and payment promises; includes APIs and a management command to mark overdue promises.

Both apps implement model, serializer, view, URL, admin, management command and tests as a minimal working implementation.

---

## Files added / modified (important ones)

- `leads/` (added earlier)
  - `models.py` — Lead, FollowUpHistory, LoanCommitment. Note: `booking` FK uses `db_constraint=False` (dev migration order safety).
  - `serializers.py` — LeadSerializer, FollowUpHistorySerializer, LoanCommitmentSerializer (passport/contact validation).
  - `services.py` — `LeadService.auto_create_from_booking(booking)` to find or create lead from a Booking.
  - `signals.py` — connects Booking.post_save to the lead auto-create service (logs exceptions).
  - `views.py` — create/list/detail/update/search, followup add, loan promise, convert, lost, followup/today, overdue-loans.
  - `urls.py` — mounted at `api/leads/` (see below).
  - `permissions.py` — `IsBranchUser` permission class (role or staff/superuser fallback).
  - `admin.py` — registered admin views for Lead and related models.
  - `management/commands/mark_overdue_loans.py` — marks overdue loans.
  - `tests/` — model & API tests for key behaviors.

- `area_leads/` (new app)
  - `models.py` — `AreaLead`, `LeadFollowUp`, `LeadConversation`, `LeadPaymentPromise`.
    - Uniqueness: `UniqueConstraint(branch_id, passport_number)` enforces per-branch passport uniqueness.
  - `serializers.py` — model serializers with validation.
  - `views.py` — all endpoints per spec (create/search/followup/create/today/conversation/add/history/payment-promise/add/upcoming/update-status).
  - `urls.py` — mounted at `api/area-leads/` (see below).
  - `permissions.py` — `IsBranchUser` for branch-only write access.
  - `admin.py` — admin registrations.
  - `management/commands/mark_overdue_promises.py` — marks overdue payment promises.
  - `tests/` — model and API tests covering uniqueness and promise logic.
  - `README.md` — short module readme.

- Project changes
  - `configuration/settings.py` — added `leads` and `area_leads` to `INSTALLED_APPS`.
  - `configuration/urls.py` — included `api/leads/` and `api/area-leads/` routes.

---

## Endpoints (summary)

- `leads` app (mounted at `/api/leads/`):
  - POST `/api/leads/create/` — create a lead (branch users only)
  - GET `/api/leads/list/` — list leads (filters: branch_id, lead_status, next_followup_date)
  - GET `/api/leads/detail/<id>/` — single lead
  - PUT `/api/leads/update/<id>/` — update (branch users only)
  - POST `/api/leads/followup/` — add follow-up (branch users only)
  - POST `/api/leads/loan-promise/` — add loan commitment (branch users only)
  - GET `/api/leads/search/?passport=&contact=&organization_id=` — search
  - PUT `/api/leads/convert/<id>/` — mark converted (branch users only)
  - PUT `/api/leads/lost/<id>/` — mark lost (branch users only)
  - GET `/api/leads/followup/today/` — today's follow-ups (branch users only)
  - GET `/api/leads/overdue-loans/` — overdue loans (branch users only)

- `area_leads` app (mounted at `/api/area-leads/`):
  - POST `/api/area-leads/create` — create lead (branch-only)
  - GET `/api/area-leads/search?passport=&contact=` — search
  - POST `/api/area-leads/followup/create` — create follow-up
  - GET `/api/area-leads/followup/today` — today's follow-ups
  - POST `/api/area-leads/conversation/add` — add conversation log
  - GET `/api/area-leads/conversation/history?lead_id=...` — conversation history
  - POST `/api/area-leads/payment-promise/add` — add payment promise
  - GET `/api/area-leads/payment-promise/upcoming` — upcoming promises
  - PATCH `/api/area-leads/update-status` — update lead_status (converted/lost)

---

## Tests

- Tests were added under each app's `tests/` folder. Key test coverage implemented already:
  - Lead model behavior and passport uniqueness (per branch for `area_leads`).
  - Booking → lead auto-create (for `leads` app) — integration via signal.
  - Management commands marking overdue promises/loans.
  - Basic API tests for create/convert/lost/followup-today/overdue.

Run tests:

```powershell
python manage.py test leads -v 2
python manage.py test area_leads -v 2
```

Note: Running `python manage.py test area_leads` may need explicit module paths in case of test discovery nuance; individual modules can be targeted as `python manage.py test area_leads.tests.test_models`.

---

## Migrations

- To generate & apply migrations for either app:

```powershell
python manage.py makemigrations leads
python manage.py makemigrations area_leads
python manage.py migrate
```

We used `--fake-initial` in development earlier to handle tables that already existed in the dev DB. For production, prefer running migrations in correct order or add explicit migration dependencies if necessary.

---

## Management commands

- `python manage.py mark_overdue_loans` (in `leads`) — marks loan commitments as `overdue` when `promised_clear_date < today`.
- `python manage.py mark_overdue_promises` (in `area_leads`) — marks payment promises as `overdue` when `due_date < today`.

Schedule the commands daily (cron or Windows Task Scheduler / Celery beat) as needed.

---

## Permissions & RBAC

- Both apps include an `IsBranchUser` permission class (in `permissions.py`) which:
  - Checks `request.user` authentication.
  - Allows access when `user.role` is `branch_user` or `branch_admin`.
  - Falls back to `is_staff` / `is_superuser` to allow admins.

Recommendation: if your user model stores branch membership differently (M2M or FK to `Branch`), we should update `IsBranchUser` to check actual branch membership to enforce true branch isolation.

---

## Notes, caveats & recommended next steps

- DB FK constraints: in `leads` the `booking` FK used `db_constraint=False` to avoid migration ordering issues in dev. For production you can remove `db_constraint=False` and add explicit migration dependency to the `booking` initial migration so DB-level FK integrity is enforced.
- Serializer UX: some serializers validate uniqueness at the DB level; consider adding explicit serializer checks (branch+passport) to return clean `400` ValidationError instead of DB IntegrityError.
- Expand tests: add RBAC tests verifying agents are denied (403) and branch users can access only their branch entries.
- Add notifications: implement a management command / Celery task to send reminders for `next_followup_date == today`.

---

If you want, I can now:

1. Harden `IsBranchUser` to check actual User↔Branch membership.
2. Add booking → `area_leads` auto-create/link integration and tests.
3. Add serializer-level branch+passport uniqueness validation and better API error messages.
4. Expand API tests for full endpoint coverage and RBAC negative tests.

Tell me which of the above you want me to do next and I will implement it and run the tests.
