# Commission Module Documentation

## Overview
The Commission module handles commission calculations, earnings tracking, and payouts for bookings in the Saer.pk backend. It integrates with the Booking, Ledger, and Organization modules to automate commission processing.

## Models

### CommissionRule
- Defines rules for calculating commissions based on bookings.
- Fields: organization, branch, receiver_type, commission_type (flat/percentage), commission_value, active, etc.
- Supports conditional rules (min/max amounts, product/inventory filters).

### CommissionEarning
- Tracks individual commission earnings from bookings.
- Fields: booking_id, service_type, earned_by_type/id, commission_amount, status (pending/earned/paid), redeemed, ledger_tx_ref, etc.
- Created automatically via signals on booking creation.

## Endpoints

### Rule Management
- `POST /api/commissions/rule/create` - Create a new commission rule
- `GET /api/commissions/rules` - List all rules with filtering

### Earning Management
- `POST /api/commissions/earning/auto` - Manually trigger earning creation (for testing)
- `PATCH /api/commissions/earning/update_status/{id}` - Update earning status
- `POST /api/commissions/redeem/{id}` - Redeem an earning (create ledger entry)
- `GET /api/commissions/earnings` - List earnings with pagination/filtering

### Reporting
- `GET /api/commissions/report/summary` - Aggregated report by status/service/earned_by_type
  - Query params: start_date, end_date, group_by (status|earned_by_type|service_type), format=csv
  - Returns JSON or CSV export

## Signal Flows

### Booking Post-Save
- On `Booking` creation/update, `booking_post_save_create_commissions` signal handler:
  - Evaluates active CommissionRules matching the booking.
  - Creates CommissionEarning records with calculated amounts.
  - Logs creation in SystemLog.

### Refund Handling (Future)
- Planned: Listen to refund events to adjust commission earnings proportionally.

## Services

### redeem_commission(earning, created_by)
- Redeems a CommissionEarning by posting to Ledger.
- Idempotent: Checks `redeemed` flag.
- Atomic transaction: Updates ledger balances and earning status.
- Returns ledger_entry.id or None on failure.
- Logs redemption in SystemLog.

### evaluate_rules_for_booking(booking)
- Matches active rules to booking.
- Computes commission amount (flat or percentage).
- Returns list of (rule, amount) tuples.

## Management Commands

### process_payouts
- `python manage.py process_payouts [--dry-run]`
- Scans earned commissions (status='earned', redeemed=False).
- Calls `redeem_commission` for each.
- Logs progress and errors.
- Dry-run mode: Lists eligible earnings without redeeming.

## Cron/Task Setup
- Schedule `process_payouts` daily/weekly via cron or Celery.
- Example cron: `0 2 * * * /path/to/python manage.py process_payouts`

## DB Indexes
- Added indexes on:
  - `commission_earnings.booking_id`
  - `commission_earnings.status`
  - `commission_earnings.redeemed`
  - `commission_rules.organization_id`
- Improves query performance for reports and payouts.

## Rollback Guidance
- To rollback a redemption: Use admin action "Reverse redemption" or manually set `redeemed=False`, clear `ledger_tx_ref`.
- For rule changes: Deactivate rules; existing earnings remain.
- Migrations: Standard Django migration rollback.

## Example API Requests

### Create Rule
```json
POST /api/commissions/rule/create
{
  "organization_id": 1,
  "commission_type": "percentage",
  "commission_value": 5.0,
  "receiver_type": "branch",
  "active": true
}
```

### Get Report
```json
GET /api/commissions/report/summary?group_by=status&start_date=2025-01-01
{
  "by": [{"status": "pending", "count": 10, "total_amount": "500.00"}],
  "total": {"total_amount": "500.00", "total_count": 10}
}
```

### Redeem Earning
```json
POST /api/commissions/redeem/123
{
  "created_by": 1
}
```

## Testing
- Unit tests: Rule evaluation, services, admin actions.
- Integration tests: Booking -> earning creation, redemption flow.
- Concurrency tests: Simulate parallel payouts.
- Run with: `python manage.py test commissions --settings=test_settings`