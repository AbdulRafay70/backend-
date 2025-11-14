# Promotion Center

This module provides a centralized `PromotionContact` model and admin/API features for collecting and managing contacts used for marketing and outreach.

Summary of changes in this task
- Added a `notes` field to `PromotionContact` to store freeform administrative/marketing annotations.
- Added migration `0003_add_notes_field.py` to apply the new field to the DB.
- Ran migrations to apply the schema changes.

Model highlights (`promotion_center/models.py`)
- `name` — contact full name (optional)
- `phone` — normalized phone, unique
- `email` — optional
- `contact_type` — lead/customer/agent/etc.
- `organization_id`, `branch_id` — integer ids (no DB FK to avoid cross-deployment FK problems)
- `status` — active/inactive
- `notes` — (new) text field for freeform comments

APIs and features
- Admin-only endpoints for listing/filtering contacts, CSV import/export, and bulk-subscribe capabilities exist in this module.
- Signal handlers upsert contacts from Booking/Lead/Payment/UniversalRegistration.
- A management command exists to mark duplicates and clean stale contacts.

How to apply the migration locally
1. Create and/or verify migrations are present in `promotion_center/migrations/`.
2. Run migrations:

```powershell
python manage.py migrate promotion_center
```

Notes / Next steps
- Decide whether to keep integer-based `organization_id`/`branch_id` fields or migrate to real FK constraints (requires DB readiness).
- Add tests that verify `notes` roundtrip via the API and import flows.
Promotion Center
=================

This mini-module centralizes promotion contacts collected from bookings, leads, payments and imports.

What it contains:
- PromotionContact model
- Signals to upsert contacts from Booking, Lead and Payment saves
- DRF ViewSet + CSV import endpoint (admin-only for writes)
- Management command to cleanup duplicates / empty rows

How to enable:
1. Add "promotion_center" to INSTALLED_APPS in your Django settings.
2. Run: python manage.py makemigrations promotion_center && python manage.py migrate
3. Include promotion_center.urls in your API router or urls.py, e.g.:

    path('api/promotion-center/', include('promotion_center.urls'))

Notes:
- The CSV import expects a `file` form field containing a CSV with at least a `phone` column.
- Phone normalization is intentionally permissive; adapt `normalize_phone` in models.py for stricter rules.
