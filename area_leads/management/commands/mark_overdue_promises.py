from django.core.management.base import BaseCommand
from django.utils import timezone
from area_leads.models import LeadPaymentPromise


class Command(BaseCommand):
    help = "Mark overdue payment promises"

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        qs = LeadPaymentPromise.objects.filter(due_date__lt=today, status="pending")
        count = qs.update(status="overdue")
        self.stdout.write(self.style.SUCCESS(f"{count} payment promises marked overdue"))
