from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def notify_new_registration(registration):
    """Send a simple email notification on new registration if EMAIL settings are configured.

    This is synchronous — you can replace with an async/celery task if needed.
    """
    try:
        if not getattr(settings, "EMAIL_HOST", None):
            logger.debug("Email not configured; skipping notification")
            return False

        subject = f"New registration: {registration.type} {registration.id}"
        message = f"A new {registration.type} has been registered.\n\nID: {registration.id}\nName: {registration.name}\nEmail: {registration.email}\n"
        recipient_list = getattr(settings, "REGISTRATION_NOTIFICATION_RECIPIENTS", [])
        if not recipient_list:
            logger.debug("No recipients configured for registration notifications")
            return False

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
        return True
    except Exception as exc:
        logger.exception("Failed to send registration notification: %s", exc)
        return False

