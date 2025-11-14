from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed default ledger accounts (CASH, BANK, SUSPENSE, SALES) for organizations"

    def add_arguments(self, parser):
        parser.add_argument("--org-id", type=int, help="Seed accounts for a single organization id")
        parser.add_argument("--dry-run", action="store_true", help="Show what would be created without saving")

    def handle(self, *args, **options):
        org_id = options.get("org_id")
        dry_run = options.get("dry_run")

        try:
            from organization.models import Organization
            from ledger.models import Account
        except Exception as e:
            self.stderr.write(f"Required apps not available: {e}")
            return

        account_types = [
            ("CASH", "Cash"),
            ("BANK", "Bank"),
            ("SUSPENSE", "Suspense"),
            ("SALES", "Sales"),
        ]

        try:
            qs = Organization.objects.all()
            if org_id:
                qs = qs.filter(id=org_id)
        except Exception as e:
            # likely missing migrations / tables in the current DB
            self.stderr.write(self.style.ERROR(f"Could not access Organization table: {e}. Ensure migrations have been applied and the DB is reachable."))
            return

        created = 0
        skipped = 0

        for org in qs:
            for acode, aname in account_types:
                name = f"{org.name} {aname}"
                if dry_run:
                    # In dry-run mode avoid touching Account table; just report
                    self.stdout.write(self.style.SUCCESS(f"Would create account: org={org.id} type={acode} name='{name}'"))
                    created += 1
                    continue

                exists = Account.objects.filter(organization=org, account_type=acode).first()
                if exists:
                    skipped += 1
                    self.stdout.write(self.style.WARNING(f"Skipping existing account for org={org.id} type={acode}"))
                    continue

                acc = Account.objects.create(organization=org, name=name, account_type=acode)
                created += 1
                self.stdout.write(self.style.SUCCESS(f"Created account {acc} for org={org.id}"))

        self.stdout.write(self.style.SUCCESS(f"Done. Created: {created}, Skipped: {skipped}"))
