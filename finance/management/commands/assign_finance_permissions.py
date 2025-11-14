from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):
    help = 'Create finance_managers group and assign finance app model permissions'

    def handle(self, *args, **options):
        group, created = Group.objects.get_or_create(name='finance_managers')

        # Models to grant permissions for
        models = [
            'chartofaccount',
            'transactionjournal',
            'financialrecord',
            'expense',
            'auditlog',
        ]

        assigned = []
        for model in models:
            try:
                ct = ContentType.objects.get(app_label='finance', model=model)
            except ContentType.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'ContentType finance.{model} not found; skipping'))
                continue

            perms = Permission.objects.filter(content_type=ct)
            for p in perms:
                group.permissions.add(p)
                assigned.append(p.codename)

        self.stdout.write(self.style.SUCCESS(f"Group 'finance_managers' ready. Assigned permissions: {', '.join(sorted(set(assigned))) if assigned else 'none'}"))
