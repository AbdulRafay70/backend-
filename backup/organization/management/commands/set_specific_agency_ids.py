from django.core.management.base import BaseCommand
from django.db import transaction
from organization.models import Agency
from organization.utils import generate_organization_id

class Command(BaseCommand):
    help = (
        "Set or regenerate agency_id for specific agencies.\n"
        "Usage: manage.py set_specific_agency_ids --pks=14,13,12 --dry-run --force"
    )

    def add_arguments(self, parser):
        parser.add_argument('--pks', type=str, required=True, help='Comma-separated list of Agency primary keys to process')
        parser.add_argument('--dry-run', action='store_true', help='Show changes without saving')
        parser.add_argument('--force', action='store_true', help='Regenerate even if agency_id exists')

    def handle(self, *args, **options):
        pks = [int(x.strip()) for x in options['pks'].split(',') if x.strip()]
        dry_run = options['dry_run']
        force = options['force']

        self.stdout.write(f"Processing Agency PKs: {pks}\n")
        changed = []
        with transaction.atomic():
            for pk in pks:
                try:
                    ag = Agency.objects.get(pk=pk)
                except Agency.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Agency pk={pk} not found"))
                    continue

                needs = force or not ag.agency_code or not ag.agency_code.startswith('AGN-')
                if not needs:
                    self.stdout.write(f"Skipping Agency pk={pk} (agency_code present and force not set): {ag.agency_code}")
                    continue

                new_id = generate_organization_id('agency')
                changed.append((pk, ag.agency_code, new_id))
                self.stdout.write(f"Will set Agency pk={pk} agency_code: {ag.agency_code} -> {new_id}")
                if not dry_run:
                    ag.agency_code = new_id
                    ag.save()

        if dry_run:
            self.stdout.write('\nDry-run complete. No changes saved.')
        else:
            self.stdout.write('\nCompleted and changes saved.')

        if changed:
            self.stdout.write('\nSummary:')
            for pk, old, new in changed:
                self.stdout.write(f" - Agency pk={pk}: {old} -> {new}")
        else:
            self.stdout.write('\nNo agencies were changed.')
