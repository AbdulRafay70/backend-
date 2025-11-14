from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission


class Command(BaseCommand):
    help = "Create finance_managers group (if not exists)."

    def handle(self, *args, **options):
        group, created = Group.objects.get_or_create(name='finance_managers')
        # Optionally add permissions here. For now, create group only.
        self.stdout.write(self.style.SUCCESS(f"Group 'finance_managers' {'created' if created else 'already exists'}"))
