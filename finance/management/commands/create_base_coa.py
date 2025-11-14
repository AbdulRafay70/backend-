from django.core.management.base import BaseCommand
from organization.models import Organization, Branch
from finance.models import ChartOfAccount


BASE_COA = [
    {"code": "1000", "name": "Cash", "type": "asset"},
    {"code": "1010", "name": "Bank", "type": "asset"},
    {"code": "2000", "name": "Payables", "type": "liability"},
    {"code": "3000", "name": "Sales / Income", "type": "income"},
    {"code": "4000", "name": "Expenses", "type": "expense"},
    {"code": "5000", "name": "Equity", "type": "equity"},
]


class Command(BaseCommand):
    help = "Create base Chart of Accounts (COA) for all organizations and their branches if not present"

    def add_arguments(self, parser):
        parser.add_argument("--org", type=int, help="Optional organization id to limit creation")

    def handle(self, *args, **options):
        org_id = options.get("org")
        orgs = Organization.objects.all()
        if org_id:
            orgs = orgs.filter(id=org_id)

        created = 0
        for org in orgs:
            # create org-level COA
            for item in BASE_COA:
                coa, was_created = ChartOfAccount.objects.get_or_create(
                    organization=org,
                    branch=None,
                    code=item["code"],
                    defaults={
                        "name": item["name"],
                        "type": item["type"],
                        "auto_created": True,
                    },
                )
                if was_created:
                    created += 1

            # branch-level COA
            for branch in org.branches.all():
                for item in BASE_COA:
                    # use branch-prefixed code to keep codes unique per branch
                    branch_code = f"{item['code']}.{branch.id}"
                    coa, was_created = ChartOfAccount.objects.get_or_create(
                        organization=org,
                        branch=branch,
                        code=branch_code,
                        defaults={
                            "name": f"{item['name']} ({branch.name})",
                            "type": item["type"],
                            "auto_created": True,
                        },
                    )
                    if was_created:
                        created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} COA entries."))
