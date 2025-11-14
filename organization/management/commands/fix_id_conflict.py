"""
SOLUTION: Rollback the problematic migration and use display-only code fields instead.

This script:
1. Rolls back organization app to migration 0012 (before we added CharField ID fields)
2. Creates new migration with 'code' fields that won't conflict with SystemLog
3. Updates models to use org_code, branch_code, agency_code (CharField) for display
4. Keeps id (IntegerField) for database relationships
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
import sys

class Command(BaseCommand):
    help = "Fix the ID field conflict by rolling back and using separate code fields"

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("\n" + "="*70))
        self.stdout.write(self.style.WARNING("FIX: ID Field Conflict Resolution"))
        self.stdout.write(self.style.WARNING("="*70 + "\n"))

        self.stdout.write("The problem:")
        self.stdout.write("  - We added CharField fields (organization_id, branch_id, agency_id)")
        self.stdout.write("  - SystemLog model expects IntegerField for these names")
        self.stdout.write("  - This causes 'expected a number but got string' errors\n")

        self.stdout.write(self.style.SUCCESS("The solution:"))
        self.stdout.write("  1. Rollback migration organization 0013")
        self.stdout.write("  2. Use different field names: org_code, branch_code, agency_code")
        self.stdout.write("  3. Keep id as IntegerField for relationships")
        self.stdout.write("  4. Use code fields for display/API only\n")

        response = input("Do you want to proceed with rollback? (yes/no): ")
        if response.lower() != 'yes':
            self.stdout.write(self.style.WARNING("Aborted."))
            return

        try:
            self.stdout.write("\nStep 1: Rolling back migration...")
            call_command('migrate', 'organization', '0012', verbosity=2)
            
            self.stdout.write(self.style.SUCCESS("\n✓ Migration rolled back successfully!"))
            self.stdout.write("\nNext steps (manual):")
            self.stdout.write("  1. Edit organization/models.py:")
            self.stdout.write("     - Remove organization_id, branch_id, agency_id CharFields")
            self.stdout.write("     - Add org_code, branch_code, agency_code CharFields instead")
            self.stdout.write("  2. Run: python manage.py makemigrations organization")
            self.stdout.write("  3. Run: python manage.py migrate organization")
            self.stdout.write("  4. Run update scripts to populate code fields")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n✗ Error: {e}"))
            sys.exit(1)
