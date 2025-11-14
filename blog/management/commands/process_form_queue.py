from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from blog.models import FormSubmissionTask
from blog import tasks as submission_tasks


BATCH_SIZE = 20


class Command(BaseCommand):
    help = "Process pending FormSubmission tasks and forward submissions to Leads API"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=BATCH_SIZE, help="Max tasks to process this run")

    def handle(self, *args, **options):
        limit = options.get("limit") or BATCH_SIZE
        now = timezone.now()

        # Pick candidate tasks that are pending and due
        candidates = (
            FormSubmissionTask.objects.filter(locked=False, status__in=("pending",), next_try_at__lte=now)
            .order_by("next_try_at")[:limit]
        )

        processed = 0
        for task in candidates:
            # try to atomically acquire the lock using an update
            updated = (
                FormSubmissionTask.objects.filter(pk=task.pk, locked=False)
                .update(locked=True, status="processing")
            )
            if not updated:
                # someone else grabbed it
                continue

            # refresh from DB to get latest submission relation
            task.refresh_from_db()
            submission = task.submission

            try:
                success, result = submission_tasks.forward_submission_to_leads(submission)
            except Exception as exc:
                success = False
                result = {"exception": str(exc)}

            # update task bookkeeping
            with transaction.atomic():
                task.refresh_from_db()
                task.attempts = task.attempts + 1
                task.locked = False
                if success:
                    task.status = "done"
                    # mark submission already updated by worker
                else:
                    if task.attempts >= task.max_attempts:
                        task.status = "failed"
                    else:
                        task.status = "pending"
                        # exponential backoff in minutes
                        backoff_minutes = min(60 * 24, 2 ** task.attempts)
                        task.next_try_at = timezone.now() + timedelta(minutes=backoff_minutes)
                task.last_error = result if not success else None
                task.save()

            processed += 1

        self.stdout.write(self.style.SUCCESS(f"Processed {processed} tasks"))
