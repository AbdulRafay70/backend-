from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from promotion_center import models as pc_models
from django.db import models


class Command(BaseCommand):
    help = "Cleanup promotion contacts: remove invalid/empty phones and mark duplicates"

    def add_arguments(self, parser):
        parser.add_argument("--delete-empty", action="store_true", help="Delete contacts with empty phone/email older than 30 days")
        parser.add_argument("--days", type=int, default=30, help="How old rows must be to be considered for deletion")

    def handle(self, *args, **options):
        days = options.get("days", 30)
        delete_empty = options.get("delete_empty", False)
        cutoff = timezone.now() - timedelta(days=days)

        # mark duplicates
        dup_counts = pc_models.PromotionContact.objects.values("phone").annotate(cnt=models.Count("id")).filter(cnt__gt=1)
        dup_phones = [d["phone"] for d in dup_counts]
        if dup_phones:
            pc_models.PromotionContact.objects.filter(phone__in=dup_phones).update(is_duplicate=True)
            self.stdout.write(self.style.SUCCESS(f"Marked {len(dup_phones)} duplicate phone groups"))
        else:
            self.stdout.write("No duplicate groups found")

        if delete_empty:
            q = pc_models.PromotionContact.objects.filter(phone__in=["", None], created_at__lt=cutoff)
            cnt = q.count()
            q.delete()
            self.stdout.write(self.style.SUCCESS(f"Deleted {cnt} empty contacts older than {days} days"))

        self.stdout.write(self.style.SUCCESS("Cleanup completed"))
