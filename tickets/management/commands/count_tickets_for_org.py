from django.core.management.base import BaseCommand
from django.db.models import Q

try:
    from tickets.models import Ticket
except Exception:
    Ticket = None


class Command(BaseCommand):
    help = "Count ticket rows for a given organization using Django ORM (uses configured DB)"

    def add_arguments(self, parser):
        parser.add_argument("--org", type=int, default=11, help="Organization id to count tickets for")
        parser.add_argument("--sample", type=int, default=5, help="Number of sample rows to show")

    def handle(self, *args, **options):
        org_id = options.get("org")
        sample = options.get("sample")

        if Ticket is None:
            self.stderr.write(self.style.ERROR("Could not import Ticket model. Are you running inside Django project?"))
            return

        # Build Q to match FK organization or integer owner fields
        q = Q(organization__id=org_id) | Q(inventory_owner_organization_id=org_id) | Q(owner_organization_id=org_id) | Q(owner_organization_id__exact=org_id)

        try:
            qs = Ticket.objects.filter(q).distinct()
            count = qs.count()
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Query failed: {e}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Found {count} Ticket rows matching organization {org_id}"))

        if count > 0:
            self.stdout.write(self.style.NOTICE(f"Showing up to {sample} sample rows:"))
            for t in qs[:sample]:
                org_fk = t.organization.id if getattr(t, 'organization', None) else None
                self.stdout.write(f"ID: {t.id} | PNR: {getattr(t, 'pnr', 'N/A')} | Flight: {getattr(t, 'flight_number', 'N/A')} | org_fk: {org_fk} | owner_org_id: {getattr(t, 'owner_organization_id', None)} | inventory_owner_org_id: {getattr(t, 'inventory_owner_organization_id', None)} | reselling_allowed: {getattr(t, 'reselling_allowed', None)}")
