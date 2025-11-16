from django.core.management.base import BaseCommand
from organization.models import ResellRequest


class Command(BaseCommand):
    help = 'Set reseller=True for all ResellRequest rows where status=APPROVED and reseller=False'

    def handle(self, *args, **options):
        qs = ResellRequest.objects.filter(status=ResellRequest.STATUS_APPROVED, reseller=False)
        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS('No rows to update.'))
            return
        updated = qs.update(reseller=True)
        self.stdout.write(self.style.SUCCESS(f'Updated {updated} resell request(s) to set reseller=True.'))
