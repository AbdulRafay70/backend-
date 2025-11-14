# Walk-In Customers — Developer Brief

Date: 2025-10-29

Purpose
-------
Support direct hotel guests booked on-site (walk-ins). This module manages the full lifecycle — Booking → Check-In → Check-Out → Ledger & Profit — under the hotel's own organization (inventory owner). Walk-ins are internal-only (cannot be linked to external agencies).

1. Main Objectives
------------------
- Allow hotel staff to record walk-in bookings from the hotel panel.
- Automate room status changes (Occupied → Cleaning Pending → Available) and ledger entries.
- Provide daily summaries for hotel occupancy and profit.
- Keep all data and ledger entries internal to the hotel's owning organization.

2. APIs Overview
----------------
A. POST /api/walkin/create

Purpose: Create a new walk-in booking from the hotel panel. Supports upsert-like behavior for the hotel panel (usually create).

Key behaviors:
- Auto-generate booking number (WALKIN-###).
- Mark room(s) status → "Occupied".
- Save customer details inline (JSON) — no separate persistent customer record required.
- Create initial ledger entry: Debit: Customer / Credit: Organization Revenue (booking receivable). If advance is paid, create Advance Paid ledger entry (Cash -> Customer).
- Support payment modes: cash, card, bank.

Request fields (JSON):
- hotel_id (int) — required
- organization_id (int) — required, must be the hotel's inventory_owner_organization_id
- booking_type (str) — must be "walk_in"
- customer (object) — { name, cnic, phone, address }
- room_details (array of objects) — [{ room_id, bed_type, price_per_night, discount, check_in (date), check_out (date) }]
- advance_paid (decimal) — >= 0
- payment_mode (str) — one of: cash, card, bank
- remarks (str) — optional

Response (201): { success: true, booking_no: "WALKIN-001", booking_id: 123 }

B. GET /api/walkin/list

Purpose: Retrieve all walk-in bookings (active + completed) with filter support.

Query filters (optional):
- status: checked_in / checked_out / cleaning_pending / available
- date: YYYY-MM-DD (returns bookings with check-in or check-out on that date)
- hotel_id or organization_id

Response shape (paginated):
- bookings: [ { booking_no, customer, room_no(s), check_in, check_out, total_amount, paid, balance, profit, status } ]
- summary: { total_walkin_bookings }

C. PUT /api/walkin/update-status/{booking_id}

Purpose: Change booking lifecycle state — check-in, check-out, or cleaning status updates.

Behaviors on status transitions:
- checked_out:
  - Finalize booking: compute final_amount (including taxes/extra charges), create ledger entries to move receivable → revenue (Credit: Organization), close balance for the customer.
  - Mark room(s) status → "Cleaning Pending".
  - Record checkout_time.
- cleaning_completed (status becomes "available"):
  - Room(s) status → "Available".

Request fields (JSON):
- status (str) — checked_in / checked_out / cleaning_pending / available
- checkout_time (datetime) — optional for check-out
- final_amount (decimal) — required on check-out
- remarks (str) — optional

D. GET /api/walkin/summary

Purpose: Daily summary with occupancy and profit for a hotel (or org).

Response example:
{
  "hotel_id": 201,
  "date": "2025-10-17",
  "total_rooms": 25,
  "occupied_rooms": 10,
  "available_rooms": 15,
  "total_sales": 85000,
  "total_expense": 20000,
  "profit": 65000
}

3. Ledger & Accounting Rules
----------------------------
All ledger entries are created under the same `organization_id` (hotel’s inventory owner). Walk-ins cannot be linked to external agencies.

Event mapping example:
- Booking Created: Debit: Customer (accounts_receivable) / Credit: Organization Revenue (booking receivable)
- Advance Paid: Debit: Cash / Credit: Customer (advance liability)
- Check-Out: Debit: Customer / Credit: Organization (revenue realized; close receivable)
- Expense (cleaning, consumables): Debit: Expense Account / Credit: Cash

Notes:
- Ledger entries should include reference fields: booking_id, hotel_id, organization_id, created_by.
- Balances for the customer's booking should be tracked until checkout (advance offsets receivable).

4. Database Design (Simplified)
------------------------------
Model: WalkInBooking

Fields (proposal):
- id (Auto PK)
- booking_no (Char) — format WALKIN-### (unique)
- hotel_id (FK -> Hotel)
- organization_id (FK -> Organization)
- booking_type (Char) — "walk_in"
- customer (JSONField) — inline customer info
- room_details (JSONField) — list of room items with pricing/dates
- status (Char) — checked_in / checked_out / cleaning_pending / available
- advance_paid (Decimal)
- total_amount (Decimal) — computed
- payment_mode (Char)
- remarks (Text)
- created_by / updated_by (int or FK) — audit
- created_at / updated_at (DateTime auto)

Optional supporting models:
- WalkInLedgerEntry (or reuse existing Ledger model) with booking_id ref
- WalkInRoomHistory (for per-room status history) — optional but useful

5. Validation Rules
-------------------
- `hotel_id` and `organization_id` are required and must be valid references; `organization_id` must match hotel's inventory owner.
- `booking_type` must be "walk_in".
- `room_details` must be a non-empty array; each item must include: room_id, price_per_night, check_in, check_out.
- `advance_paid` must be numeric and >= 0.
- `payment_mode` must be one of: [cash, bank, card].
- `status` must be one of the allowed states.

6. Auto Workflows
-----------------
Triggers and automatic actions:
- Create booking:
  - Generate unique `booking_no` (WALKIN sequence).
  - Compute `total_amount` from `room_details`.
  - Mark room(s) status → "Occupied" (update room model / inventory).
  - Create ledger entry for receivable and advance (if paid).
- Check-out:
  - Compute `final_amount`, add any extras/expenses.
  - Create ledger entries to realize revenue and close customer balance.
  - Mark room(s) status → "Cleaning Pending".
- Cleaning complete:
  - Mark room(s) status → "Available".
- Summary view:
  - Aggregate sales, expenses, profit for date ranges.

7. Reports & Summary Calculations
---------------------------------
- Profit = Sum(final_amount for completed bookings) - Sum(expenses)
- Total sales = Sum(final_amount) of bookings with status checked_out (within date range)

Filters for reports: date range, hotel_id, organization_id.

8. Security & Ownership
-----------------------
- All walk-in bookings must be created under the hotel's `inventory_owner_organization_id`.
- Hotel staff and hotel admins (organization-scoped permissions) can create/update bookings; only hotel org staff may modify or delete their hotel's walk-in bookings.
- System must prevent assigning bookings to external agencies or other organizations.
- Ledger entries belong to the same organization and should be visible only to org staff with appropriate ledger permissions.

Acceptance Criteria
-------------------
| # | Requirement | Pass Condition |
|---|-------------|----------------|
| 1 | Walk-in booking created with booking_no | Room(s) marked "Occupied" and initial ledger entry created |
| 2 | Update status to checked_out | Ledger updated and balance closed; room(s) → "Cleaning Pending" |
| 3 | Cleaning update | Room(s) → "Available" |
| 4 | GET /api/walkin/list returns bookings | Filters (status, date, hotel_id/org_id) work correctly |
| 5 | Summary report correct | Sales, expenses, profit accurate for the date range |
| 6 | Security enforced | Only hotel org staff can create/update/delete bookings |

Implementation notes & developer guidance
----------------------------------------
- Booking number generation: use a DB-backed sequence or atomic counter (e.g., table to store last walkin number per hotel) to avoid collisions in concurrent creates. Prefix with `WALKIN-`.
- Room status updates must be transactional with booking creation/update to avoid race conditions (use DB transactions).
- Ledger integration: reuse existing ledger model if available. Ensure ledger entries reference booking_id and can be filtered by organization.
- Testing: include unit tests for create, status transitions, ledger effects, permission checks, and summary calculations. Also add integration tests that simulate multiple room bookings and check ledger balances.
- Migration considerations: if you choose to store created_by/updated_by as FK(User), ensure migrations do not break test DB setup; using integer IDs is acceptable for initial implementation.

Sample payloads
---------------
Create walkin (POST /api/walkin/create):

```json
{
  "hotel_id": 201,
  "organization_id": 55,
  "booking_type": "walk_in",
  "customer": {"name": "Ali Khan", "cnic": "12345-6789012-3", "phone": "0300-1234567", "address": "Lahore"},
  "room_details": [
    {"room_id": 101, "bed_type": "double", "price_per_night": 3500, "discount": 0, "check_in": "2025-10-29", "check_out": "2025-10-31"}
  ],
  "advance_paid": 2000,
  "payment_mode": "cash",
  "remarks": "walk-in from reception"
}
```

Update status (PUT /api/walkin/update-status/123):

```json
{
  "status": "checked_out",
  "checkout_time": "2025-10-31T11:00:00Z",
  "final_amount": 7000,
  "remarks": "checkout with no extra charges"
}
```

9. Estimated tasks & effort (rough)
----------------------------------
- Models + migrations: 2–4 hours
- Views / Serializers / Endpoints: 3–6 hours
- Ledger wiring and transactions: 2–4 hours (depends on existing ledger complexity)
- Tests (unit + small integration): 2–4 hours
- Fixtures + sample data: 1 hour

10. Next steps / optional enhancements
-------------------------------------
- Add per-room history model for audit and occupancy analytics.
- Add hooks for housekeeping workflows (assign cleaning staff, notify housekeeping queue).
- Add UI components for hotel panel to manage walk-ins, quick check-in, and quick check-out.


---

If you'd like, I can:
- Implement the data model and CRUD endpoints now, including tests and a sample fixture, or
- Generate migration and model code only for review, or
- Add a management command to seed sample walk-in bookings.

Which one should I start with next?