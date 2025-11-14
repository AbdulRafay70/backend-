Finance Migration Plan (quick checklist)
=====================================

This file contains a small, conservative checklist to apply finance/booking-related migrations safely in staging/production.

1) Pre-check (run on production DB, read-only)

   -- check whether tables exist and approximate schema
   -- SQL examples (run in your DB client):

   -- Does the booking table contain the new columns?
   SELECT sql FROM sqlite_master WHERE type='table' AND name='booking_booking';

   -- For MySQL / MariaDB use:
   SHOW COLUMNS FROM booking_booking;

   -- For Postgres use:
   \d booking_booking

2) If tables already match models

   - If production schema already contains the columns exactly as models, mark migration as applied (fake) for the specific revisions:

     python manage.py migrate booking --fake 0067

   - Then run normal migrations for remaining apps:

     python manage.py migrate

3) If tables do not match or are missing columns

   - Run migrations in staging first. Create a DB snapshot/backup before applying.
   - Apply migrations in staging and run smoke tests (see step 5).

4) Backup & apply in production

   - Create a DB backup or snapshot.
   - Put site in maintenance mode if necessary.
   - Apply migrations:

     python manage.py migrate booking

   - If any migration fails due to existing objects, inspect the failing migration SQL and resolve (manual ALTER TABLE may be required).

5) Smoke tests after migrations

   - Run minimal smoke checks: attempt to create a booking via API, create a payment, and ensure FinancialRecord is created.
   - Run: python manage.py test booking finance --keepdb -v 2

Notes & caveats
----------------
- During development some finance migrations were faked to proceed locally. Do not blindly re-run in production without checking the existing schema first.
- If you need assistance running the safety checks against your staging DB or preparing a one-time SQL patch, I can prepare the exact ALTER TABLE statements after inspecting the production schema.

Contact
-------
If you'd like, I can walk through the staging migration and run the smoke tests with you (remote pairing or a step-by-step script).
