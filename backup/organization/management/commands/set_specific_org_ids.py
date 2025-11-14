from django.core.management.base import BaseCommand
from django.db import transaction
from organization.models import Organization
from organization.utils import generate_organization_id

class Command(BaseCommand):
    help = (
        "Set or regenerate organization_id for specific organizations.\n"
        "Usage: manage.py set_specific_org_ids --pks=1,2,3 --dry-run --force"
    )

    def add_arguments(self, parser):
        parser.add_argument('--pks', type=str, required=True, help='Comma-separated list of Organization primary keys to process')
        parser.add_argument('--dry-run', action='store_true', help='Show changes without saving')
        parser.add_argument('--force', action='store_true', help='Regenerate even if organization_id exists')

    def handle(self, *args, **options):
        pks = [int(x.strip()) for x in options['pks'].split(',') if x.strip()]
        dry_run = options['dry_run']
        force = options['force']

        self.stdout.write(f"Processing Organization PKs: {pks}\n")
        changed = []
        with transaction.atomic():
            for pk in pks:
                try:
                    org = Organization.objects.get(pk=pk)
                except Organization.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Organization pk={pk} not found"))
                    continue

                needs = force or not org.org_code or not org.org_code.startswith('ORG-')
                if not needs:
                    self.stdout.write(f"Skipping Organization pk={pk} (org_code present and force not set): {org.org_code}")
                    continue

                new_id = generate_organization_id('organization')
                changed.append((pk, org.org_code, new_id))
                self.stdout.write(f"Will set Organization pk={pk} org_code: {org.org_code} -> {new_id}")
                if not dry_run:
                    org.org_code = new_id
                    org.save()

        if dry_run:
            self.stdout.write('\nDry-run complete. No changes saved.')
        else:
            self.stdout.write('\nCompleted and changes saved.')

        if changed:
            self.stdout.write('\nSummary:')
            for pk, old, new in changed:
                self.stdout.write(f" - Organization pk={pk}: {old} -> {new}")
        else:
            self.stdout.write('\nNo organizations were changed.')
