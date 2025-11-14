from django.core.management.base import BaseCommand
from django.utils import timezone
from leads.models import LoanCommitment


class Command(BaseCommand):
    help = "Mark overdue loans and print summary"

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        overdue_qs = LoanCommitment.objects.filter(promised_clear_date__lt=today, status="pending")
        count = overdue_qs.count()
        overdue_qs.update(status="overdue", updated_at=timezone.now())
        self.stdout.write(self.style.SUCCESS(f"{count} loan(s) marked overdue."))
