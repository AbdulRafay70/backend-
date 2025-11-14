## Hotel Outsourcing Module — Implementation & How‑to

This document summarizes the Hotel Outsourcing feature added to the project, what changed, how it works, how to run and test it locally, and suggested next steps.

## What we implemented

- Model: `HotelOutsourcing` (in `booking/models.py`)
  - Fields: `booking`, `booking_hotel_detail`, `hotel_name`, `price`, `quantity`, `number_of_nights`, `currency`, `is_paid`, `agent_notified`, `ledger_entry_id`, `is_deleted`, timestamps.
  - Property: `outsource_cost` (price * quantity * nights)
  - Soft-delete method: `soft_delete()` uses `is_deleted` flag.
  - DB migration: `booking/migrations/0068_booking_is_outsourced_and_more.py` (applied during tests).

- Serializer: `HotelOutsourcingSerializer` (in `booking/serializers.py`) to create/read outsourcing records and update related booking/hotel detail flags.

- API: `HotelOutsourcingViewSet` (in `booking/views.py`)
  - Routes (registered in `booking/urls.py` at `/api/` router):
    - `POST /api/hotel-outsourcing/` → create outsourcing record (creates payable ledger entry & notifies agent)
    - `GET /api/hotel-outsourcing/` → list with filters (organization/branch/booking_id/hotel_name/status)
    - `PATCH /api/hotel-outsourcing/{id}/payment-status/` → mark paid/unpaid (creates settlement entry when marking paid)
  - Agent scoping: non-staff users are filtered to see only their bookings.
  - Idempotency guard: Before creating a settlement entry, the view checks whether the source ledger entry metadata already contains `settled: true`. If yes, it skips creating another settlement (prevents duplicate settlements on retries).

- Signals (in `booking/signals.py`)
  - `post_save` for `HotelOutsourcing`:
    - Creates a payable `LedgerEntry` + `LedgerLine`s using helper `organization.ledger_utils.create_entry_with_lines`.
    - Updates `HotelOutsourcing.ledger_entry_id` via `queryset.update(...)` (to avoid recursive saves inside the signal).
    - Schedules agent notification and `SystemLog` creation via `transaction.on_commit()` to avoid `TransactionManagementError` for writes inside an atomic block.
    - Sets `booking.is_outsourced = True` where appropriate.
  - `post_delete` for `HotelOutsourcing`:
    - Creates a reversal ledger entry for the source entry using `organization.ledger_utils.create_reversal_entry` and marks the source ledger entry reversed.

- Ledger helpers (in `organization/ledger_utils.py`)
  - `create_entry_with_lines` — create LedgerEntry + LedgerLine rows and update account balances.
  - `create_settlement_entry` — create a settlement entry that debits PAYABLE and credits CASH/BANK; marks source entry metadata `settled: True`.
  - `create_reversal_entry` — mirror source lines with reversed debit/credit values and mark source `reversed = True`.
  - `mark_entry_settled` — toggle `metadata['settled']` on a LedgerEntry.

- Notifications (placeholder)
  - `notifications/utils.py` contains a `send_agent_message` stub that writes a `SystemLog` entry. This is intentionally lightweight for tests and can be swapped for real notifications later.

- Admin: `HotelOutsourcing` registered in `booking/admin.py` for admin UI access.

- Tests
  - New tests added:
    - `tests/test_hotel_outsourcing_v2.py` — end-to-end tests verifying create → ledger entry → notification, payment-status settlement, and deletion reversal using the project ledger models.
    - `tests/test_hotel_outsourcing_routes.py` — route coverage: staff vs agent access to the `payment-status` endpoint.
  - Legacy tests updated:
    - `tests/test_hotel_outsourcing.py` was updated to create `auth.User` and link a `UserProfile` instead of directly creating a `UserProfile` with `username` to match the current `users` model.
  - Result: Full test suite (`python manage.py test -v 2`) passes (42 tests at time of commit).

## Design & Contracts

- Inputs / Outputs
  - Creating outsourcing: input is booking id and hotel details; output is the created `HotelOutsourcing` object with `ledger_entry_id` pointing to a payable ledger entry.
  - Payment-status: input `is_paid` boolean; behavior: when marking `True`, create settlement entry (if not already settled) and mark original payable entry settled; when marking `False`, mark payable entry as unsettled.

- Error modes
  - Signals and ledger operations are guarded with try/except so the API does not fail if ledger helper operations fail. Notifications are scheduled via `transaction.on_commit` to avoid atomic-block write errors.

- Edge cases considered
  - Duplicate settlement prevention with idempotency guard.
  - Avoid saving the `HotelOutsourcing` instance inside its own `post_save` signal (use `queryset.update` instead).
  - Missing ledger accounts: ledger helpers return `None` and we purposely don't block the API if ledger ops cannot be performed; this is logged and can be surfaced as needed.
  - Agent scoping: non-staff users only see their booking-related outsource records.

## How to run locally

1. Install requirements (project already contains `requirements.txt`).

2. Run migrations (if needed):

```powershell
python manage.py migrate
```

3. Run the full tests to validate the module and the rest of the project:

```powershell
python manage.py test -v 2
```

All tests should pass as of the current commit (42 tests in the suite we ran locally).

## Key file locations

- Models: `booking/models.py` (look for `HotelOutsourcing`)
- Views & API: `booking/views.py` (`HotelOutsourcingViewSet`)
- Serializers: `booking/serializers.py` (`HotelOutsourcingSerializer`)
- Signals: `booking/signals.py` (ledger creation + notifications)
- Ledger helpers: `organization/ledger_utils.py`
- Tests:
  - New e2e tests: `tests/test_hotel_outsourcing_v2.py`
  - Route tests: `tests/test_hotel_outsourcing_routes.py`
  - Updated legacy tests: `tests/test_hotel_outsourcing.py`

## How the ledger flow works (sequence)

1. Create `HotelOutsourcing` (POST):
   - Signal creates a payable `LedgerEntry` (narration, metadata: service_type `outsourcing`), ledger lines debit to a SUSPENSE/PAYABLE and credit to PAYABLE/CASH depending on config and account lookup.
   - Signal updates `HotelOutsourcing.ledger_entry_id` using `queryset.update(...)` to avoid recursion.
   - On commit, the system sends a notification (SystemLog) to the agent.

2. Mark payment (PATCH `payment-status` with `is_paid: true`):
   - View toggles `is_paid` and in a transaction calls `create_settlement_entry` (unless the source entry is already settled).
   - `create_settlement_entry` debits PAYABLE and credits CASH/BANK and records metadata `'settlement_of': <source_id>`.
   - Source `LedgerEntry.metadata['settled']` is set to True by the helper.

3. Delete outsourcing (DELETE):
   - `post_delete` signal creates a reversing `LedgerEntry` that mirrors the original lines with flipped debit/credit.
   - Marks the source ledger entry as reversed.

## Testing notes and dev tips

- If you add a new ledger account type, ensure `organization.ledger_utils.find_account` knows how to find it by `account_type`.
- Be careful not to call `instance.save()` inside `post_save` handlers. Use `queryset.update()` or `transaction.on_commit()` to schedule side effects after commit.
- The idempotency guard checks the `metadata['settled']` flag on the source `LedgerEntry`. If you change where `settled` is stored, update the guard accordingly.

## Next steps / Improvements

- Replace `notifications/utils.send_agent_message` stub with a real notification provider (email/SMS/push). Update tests to mock external calls.
- Add an explicit idempotency key support if clients will retry with different payloads (e.g., pass a `client_request_id` to ensure global idempotency across retries).
- Add audit endpoints to list settlement and reversal history for an outsourcing record.
- Harden error logging and monitoring for ledger helper failures; currently failures are swallowed to avoid blocking core flows.

---

If you want, I can also:
- Add a small unit test that calls `payment-status` twice to prove idempotency (only one settlement entry created).
- Create a short changelog entry or PR description summarizing these changes for review.

Which follow-up would you like me to do next?