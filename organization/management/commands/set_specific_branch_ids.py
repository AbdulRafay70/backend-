from django.core.management.base import BaseCommand
from django.db import transaction
from organization.models import Branch
from organization.utils import generate_organization_id

class Command(BaseCommand):
    help = (
        "Set or regenerate branch_id for specific branches.\n"
        "Usage: manage.py set_specific_branch_ids --pks=21,20,19 --dry-run --force"
    )

    def add_arguments(self, parser):
        parser.add_argument('--pks', type=str, required=True, help='Comma-separated list of Branch primary keys to process')
        parser.add_argument('--dry-run', action='store_true', help='Show changes without saving')
        parser.add_argument('--force', action='store_true', help='Regenerate even if branch_id exists')

    def handle(self, *args, **options):
        pks = [int(x.strip()) for x in options['pks'].split(',') if x.strip()]
        dry_run = options['dry_run']
        force = options['force']

        self.stdout.write(f"Processing Branch PKs: {pks}\n")
        changed = []
        with transaction.atomic():
            for pk in pks:
                try:
                    br = Branch.objects.get(pk=pk)
                except Branch.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Branch pk={pk} not found"))
                    continue

                needs = force or not br.branch_code or not br.branch_code.startswith('BRN-')
                if not needs:
                    self.stdout.write(f"Skipping Branch pk={pk} (branch_code present and force not set): {br.branch_code}")
                    continue

                new_id = generate_organization_id('branch')
                changed.append((pk, br.branch_code, new_id))
                self.stdout.write(f"Will set Branch pk={pk} branch_code: {br.branch_code} -> {new_id}")
                if not dry_run:
                    br.branch_code = new_id
                    br.save()

        if dry_run:
            self.stdout.write('\nDry-run complete. No changes saved.')
        else:
            self.stdout.write('\nCompleted and changes saved.')

        if changed:
            self.stdout.write('\nSummary:')
            for pk, old, new in changed:
                self.stdout.write(f" - Branch pk={pk}: {old} -> {new}")
        else:
            self.stdout.write('\nNo branches were changed.')
