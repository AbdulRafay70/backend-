from django.dispatch import receiver
from django.db.models.signals import post_save

# Placeholder for passport_leads signals.
# Implementations to integrate with bookings, ledger sync and automations will go here.


def _noop():
    return None
