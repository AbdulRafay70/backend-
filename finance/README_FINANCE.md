Finance module — endpoints, notes, and caveats

Overview
--------
This `finance` app implements a double-entry ledger integration, expenses, financial records, reporting and CSV exports.

Key endpoints
-------------
- POST /api/finance/expense/add — create an Expense (creates a TransactionJournal and attempts posting to ledger)
- GET  /api/finance/expense/list — list expenses with filters
- GET  /api/finance/summary/all — aggregate P&L by org/branch with breakdown_by_module
- GET  /api/finance/ledger/by-service — ledger entries grouped by service
- POST /api/finance/manual/post — manual posting (only `finance_managers` group or superuser)

Walk-in & Linked Booking
------------------------

This project supports "walk-in" bookings (bookings created without a prior online order) and linking a walk-in to an existing booking for auditability.

- Booking model fields (added):
	- `is_walkin` (boolean) — marks a booking as a walk-in.
	- `linked_booking` (nullable FK to `Booking`) — optional link from a walk-in to an existing booking.

- API endpoints (booking router):
	- POST /api/bookings/walkin/ — create a walk-in booking. Accepts the same payload as the regular booking create endpoint. To link the newly created walk-in to an existing booking include `linked_booking_id` in the payload.
		- Example payload (JSON):
			{
				"agency_id": 12,
				"user_id": 34,
				"status": "Pending",
				"linked_booking_id": 42
			}

	- POST /api/bookings/{id}/link/ — link or unlink a booking to another booking. POST body: `{ "linked_booking_id": <id> }` to link, or `{ "linked_booking_id": null }` to unlink.

- Permissions: creating walk-ins and linking bookings is restricted to staff, superusers, or users in the `finance_managers` group. Use `python manage.py create_finance_group` to seed the group.

- Reporting / ledger behavior: when profit/loss is calculated for a booking the `linked_booking_id` (if present) is stored inside `FinancialRecord.metadata` so reports and audits can trace walk-ins back to the primary booking. No FinancialRecord merging is performed automatically — records remain separate for auditability.

- Migration note: a migration file adding the `is_walkin` and `linked_booking` fields was generated (`booking/migrations/0067_booking_is_walkin_booking_linked_booking.py`). Apply it in staging/production with care; if your production DB already contains booking schema differences inspect the migration and follow the steps in `finance/MIGRATION_CHECKLIST.md`.

Reports
-------
- GET  /reports/profit-loss — JSON summary grouped by service_type
- GET  /reports/profit-loss/csv — CSV export of profit & loss
- GET  /reports/fbr/summary — JSON FBR-ready summary (organization/year)
- GET  /reports/fbr/summary/csv — CSV export with per-record rows and a summary row

Important implementation notes & caveats
--------------------------------------
- Canonical currency: PKR. When expenses use SAR, the system attempts to convert via `RiyalRate` (helper `convert_sar_to_pkr`). If conversion fails, the original amount is used.
- CSV exports: The FBR CSV implemented here uses an inferred layout with placeholder tax rates and withholding calculations. For legal/compliance exports, replace the tax mapping and calculation logic with the official FBR field definitions and rates.
- Manual posting permissions: only users in `finance_managers` group or superusers can post; use `python manage.py create_finance_group` to seed the group.
- Migrations: during development some finance migrations were faked to align with an existing DB schema. See MIGRATION_CHECKLIST.md before running migrations in production.
- Timezones: tests should use timezone-aware datetimes (django.utils.timezone.now()). Some tests previously produced a RuntimeWarning about naive datetimes.

Next steps for production readiness
----------------------------------
1. Provide official FBR CSV/JSON spec (required columns, data types, rounding rules) so we can implement strict exporter and pass compliance tests.
2. Review faked migrations and create a safe migration plan for production DBs.
3. Add more integration tests for booking->payment->ledger->financial_record flows and SAR conversion edge cases.
4. Configure group permissions and map Django model permissions to `finance_managers` group in a post-deploy script.

If you want I can implement the official FBR format as soon as you provide the spec.

--

COMPREHENSIVE FINANCE REFERENCE (ADDITIONAL DETAILS)

The section below expands the short notes above into a full reference: endpoints, sample JSON, flows, management commands, migrations, tests, and troubleshooting.

Status / completion
-------------------
- Core models implemented: `ChartOfAccount`, `TransactionJournal`, `FinancialRecord`, `Expense`, `AuditLog`.
- Double-entry posting pipeline implemented: `TransactionJournal` -> `post_journal_to_ledger` -> `LedgerEntry`/`LedgerLine` updates.
- Expense APIs (create/list) implemented with auto-posting attempts to the ledger.
- Manual posting endpoint implemented with permissions for the `finance_managers` group.
- Profit & Loss calculations: persisted `FinancialRecord` snapshots and read-time aggregation for walk-ins/linked bookings.
- Reporting endpoints (JSON + CSV) for P&L and a basic FBR summary (FBR CSV uses placeholder rules — replace with official spec if required).
- Compact dashboard endpoint implemented: `GET /api/finance/dashboard` (metrics for embedding in Sweegar/Swagger UI).
- Audit logs and signals: booking/payment changes trigger recalculation & `AuditLog` snapshots.
- Management commands: COA seeder, finance group creation, permissions assignment, `merge_walkin_financials`, `diagnose_finance_endpoints`.
- Tests: unit and integration tests for posting, aggregation, SAR conversion edge cases, reporting, merge command.

Endpoints & JSON examples (quick index)
--------------------------------------
- POST /api/finance/expense/add — create Expense (see example below)
- GET  /api/finance/expense/list — list expenses
- GET  /api/finance/summary/all — aggregated totals + breakdown
- GET  /api/finance/ledger/by-service — listing of FR rows
- POST /api/finance/manual/post — manual TransactionJournal posting
- GET  /reports/profit-loss, /reports/profit-loss/csv — P&L (JSON + CSV)
- GET  /reports/fbr/summary, /reports/fbr/summary/csv — FBR summary (placeholder rules)
- GET  /api/finance/dashboard & /api/finance/dashboard/period — dashboard JSON

Example: Expense create (expanded)
---------------------------------
Request (POST /api/finance/expense/add):

{
	"organization": 1,
	"branch": 2,
	"category": "fuel",
	"amount": "150.00",
	"currency": "PKR",
	"date": "2025-10-28",
	"booking_id": 10,
	"coa": 5,
	"notes": "Transport fuel for transfer",
	"module_type": "transport",
	"payment_mode": "cash",
	"paid_to": "Driver A"
}

Response (201) on success (posted):

{
	"id": 12,
	"organization": 1,
	"branch": 2,
	"category": "fuel",
	"amount": "150.00",
	"currency": "PKR",
	"date": "2025-10-28",
	"booking_id": 10,
	"coa": 5,
	"ledger_entry_id": 99,
	"notes": "Transport fuel for transfer",
	"module_type": "transport",
	"payment_mode": "cash",
	"paid_to": "Driver A",
	"created_at": "2025-10-30T10:00:00Z"
}

Partial success when posting to ledger fails (201):

{
	"expense": { /* expense object */ },
	"warning": "Journal created but failed to post: <error message>"
}

Notes about ledger posting
-------------------------
- Posting is attempted synchronously by default so that ledger_entries exist immediately on success. If posting fails the journal remains and `TransactionJournal.posted` stays false.
- For scale you can convert `post_journal_to_ledger` to run in a background worker (Celery/RQ). Keep the current code paths for auditability.

Diagnostics & quick fixes (common problems)
------------------------------------------
- DisallowedHost: when using the test client or some proxies you may see `Invalid HTTP_HOST header: 'testserver'`. Add `testserver` (or your domain) to `ALLOWED_HOSTS` in `configuration/settings_local.py`.
- Missing DB column errors: run `python manage.py showmigrations finance` and `python manage.py migrate finance`. If the environment was migrated partially, inspect SQL with `python manage.py sqlmigrate finance 0002`.

Management commands reference
--------------------------
- `create_base_coa` — seed COA
- `create_finance_group` — create `finance_managers`
- `assign_finance_permissions` — grant permissions
- `merge_walkin_financials` — produce aggregated FinancialRecord for a booking and its linked walk-ins
- `diagnose_finance_endpoints` — run authenticated calls and print status/traceback (useful for capturing live 500s)

Where to go next
----------------
- If you want the official FBR CSV format implemented, provide the spec and I'll implement and test it.
- I can add full OpenAPI response schemas (drf-spectacular) for each endpoint so Sweegar UI displays exact shapes in the Swagger UI.

End of comprehensive reference.

