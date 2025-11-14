"""
Management command to UPDATE only the primary ID field for Organization, Branch, and Agency.
This removes the need for separate organization_id, branch_id, agency_id CharField columns.

WARNING: This will modify primary keys. Back up your database first!
"""
from django.core.management.base import BaseCommand
from django.db import connection, transaction

class Command(BaseCommand):
    help = (
        "Update Organization, Branch, and Agency primary IDs to use prefixed format (ORG-0001, BRN-0001, AGN-0001).\n"
        "WARNING: This modifies primary keys. Backup database first!\n"
        "Options:\n"
        "  --dry-run: show what would change without saving."
    )

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Do not save changes; just report')

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        self.stdout.write(self.style.WARNING("\n⚠️  WARNING: This will modify primary keys!"))
        self.stdout.write(self.style.WARNING("⚠️  Ensure you have a database backup before proceeding.\n"))

        if dry_run:
            self.stdout.write(self.style.SUCCESS("Running in DRY-RUN mode...\n"))
        
        # Get current records
        with connection.cursor() as cursor:
            # Check Organizations
            cursor.execute("SELECT id, name FROM organization_organization ORDER BY id")
            orgs = cursor.fetchall()
            self.stdout.write(f"\nFound {len(orgs)} Organizations:")
            for idx, (pk, name) in enumerate(orgs, 1):
                new_id = f"ORG-{idx:04d}"
                self.stdout.write(f"  {pk} -> {new_id} ({name})")

            # Check Branches
            cursor.execute("SELECT id, name, organization_id FROM organization_branch ORDER BY id")
            branches = cursor.fetchall()
            self.stdout.write(f"\nFound {len(branches)} Branches:")
            for idx, (pk, name, org_id) in enumerate(branches, 1):
                new_id = f"BRN-{idx:04d}"
                self.stdout.write(f"  {pk} -> {new_id} ({name}, org={org_id})")

            # Check Agencies
            cursor.execute("SELECT id, name, branch_id FROM organization_agency ORDER BY id")
            agencies = cursor.fetchall()
            self.stdout.write(f"\nFound {len(agencies)} Agencies:")
            for idx, (pk, name, br_id) in enumerate(agencies, 1):
                new_id = f"AGN-{idx:04d}"
                self.stdout.write(f"  {pk} -> {new_id} ({name}, branch={br_id})")

        if dry_run:
            self.stdout.write(self.style.SUCCESS('\n✓ Dry-run complete. No changes made.'))
            return

        self.stdout.write(self.style.ERROR(
            "\n⚠️  IMPORTANT: Changing primary keys requires careful database migration."
        ))
        self.stdout.write(self.style.ERROR(
            "⚠️  This script cannot safely change PKs while foreign keys exist."
        ))
        self.stdout.write(self.style.WARNING(
            "\n❌ Recommendation: Instead of changing PKs, use separate code fields (org_code, branch_code, agency_code)."
        ))
        self.stdout.write(self.style.WARNING(
            "❌ Or rollback the migration that added organization_id/branch_id/agency_id CharFields."
        ))
        
        self.stdout.write(self.style.WARNING("\nScript stopped to prevent data corruption."))
        self.stdout.write(self.style.SUCCESS(
            "\nNext steps:\n"
            "1. Rollback migration: python manage.py migrate organization 0012\n"
            "2. Keep using integer IDs internally\n"
            "3. Add display-only fields like 'org_code', 'branch_code', 'agency_code' if needed for UI"
        ))
