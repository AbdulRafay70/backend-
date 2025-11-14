Finance migration checklist

Context:
- During development the database already contained some finance-related tables. To progress in the dev environment certain migrations were marked as applied (`--fake`). This checklist documents what was faked and recommended steps for production.

What was faked in dev (examples):
- finance.0001_initial and finance.0002 were marked applied in places where tables already existed.

Recommended production migration plan:
1. Backup your production database before any migration.
2. Inspect current production schema for `finance_*` tables. If the tables already exist and match the models, you can mark migrations as applied using:
   python manage.py migrate finance --fake 0001
   python manage.py migrate finance --fake 0002
   (Only use --fake after confirming schema match.)
3. If tables do not exist, run migrations normally:
   python manage.py migrate finance
4. If FK constraints reference tables not yet migrated (organization, booking), run migrations in the correct order or apply the missing app migrations first.
5. Test in a staging environment that all finance endpoints work before deploying to production.

If you prefer, I can prepare a migration-diff script to compare model definitions to your production DB schema and produce a safe migration plan.
