from django.core.management.base import BaseCommand
from organization.models import Organization, Agency
from ledger.models import Account
from decimal import Decimal


class Command(BaseCommand):
    help = "Create default ledger accounts for all Organizations and Agencies (if missing)."

    def add_arguments(self, parser):
        parser.add_argument("--create-sample-entry", action="store_true", help="Create one sample ledger entry for first org")

    def handle(self, *args, **options):
        created = 0
        for org in Organization.objects.all():
            # create Sales account
            if not Account.objects.filter(organization=org, account_type="SALES").exists():
                Account.objects.create(
                    name=f"Sales - {org.name}",
                    account_type="SALES",
                    organization=org,
                    balance=Decimal("0.00"),
                )
                created += 1
            # create Cash account
            if not Account.objects.filter(organization=org, account_type="CASH").exists():
                Account.objects.create(
                    name=f"Cash - {org.name}",
                    account_type="CASH",
                    organization=org,
                    balance=Decimal("0.00"),
                )
                created += 1
            # create Suspense account
            if not Account.objects.filter(organization=org, account_type="SUSPENSE").exists():
                Account.objects.create(
                    name=f"Suspense - {org.name}",
                    account_type="SUSPENSE",
                    organization=org,
                    balance=Decimal("0.00"),
                )
                created += 1

        for agency in Agency.objects.all():
            if not Account.objects.filter(agency=agency, account_type="AGENT").exists():
                Account.objects.create(
                    name=f"Agent - {agency.name}",
                    account_type="AGENT",
                    agency=agency,
                    balance=Decimal("0.00"),
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Bootstrap complete. Accounts created: {created}"))

        if options.get("create_sample_entry"):
            # create a sample payment-based ledger entry by creating a Payment is more involved; skip for now
            self.stdout.write(self.style.NOTICE("Sample entry creation not implemented in this command."))
