from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import FormSubmission, FormSubmissionTask
from django.utils import timezone


@receiver(post_save, sender=FormSubmission)
def on_form_submission_created(sender, instance, created, **kwargs):
    """When a new FormSubmission is created, enqueue a forwarding task.

    We create the task inside transaction.on_commit to avoid creating tasks for rolled-back transactions.
    """
    if not created:
        return

    def _create_task():
        # only create one pending task for a submission
        if not FormSubmissionTask.objects.filter(submission=instance, status__in=("pending", "processing")).exists():
            FormSubmissionTask.objects.create(submission=instance, next_try_at=timezone.now())

    transaction.on_commit(_create_task)
