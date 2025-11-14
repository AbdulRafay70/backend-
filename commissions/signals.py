from django.dispatch import receiver
from django.db.models.signals import post_save
from django.conf import settings
from django.utils import timezone

from booking.models import Booking
from .models import CommissionEarning, CommissionRule
from .services import evaluate_rules_for_booking
from logs.models import SystemLog


@receiver(post_save, sender=Booking)
def booking_post_save_create_commissions(sender, instance, created, **kwargs):
    """
    On booking creation (or update where status/payment occurs), evaluate commission
    rules and create CommissionEarning records as necessary.
    This function intentionally keeps logic lean and delegates calculation to services.
    """
    # Only run on create or when booking is confirmed/paid — keep simple for now
    try:
        booking_id = instance.id
        # evaluate matching rules
        matches = evaluate_rules_for_booking(instance)
        created_earnings = []
        for rule, amount in matches:
            # Map rule receiver to earned_by fields
            receiver_type = getattr(rule, "receiver_type", None)
            if receiver_type == "branch":
                earned_by_id = getattr(instance, "branch_id", None)
            elif receiver_type == "agency":
                earned_by_id = getattr(instance, "agency_id", None)
            else:
                earned_by_id = None

            earning = CommissionEarning.objects.create(
                booking_id=booking_id,
                service_type=getattr(instance, "booking_type", None),
                earned_by_type=receiver_type or "branch",
                earned_by_id=earned_by_id,
                commission_amount=amount,
                status="pending",
                extra={"rule_id": getattr(rule, "id", None)},
            )
            created_earnings.append(earning.id)

        # Log created earnings in SystemLog
        if created_earnings:
            SystemLog.objects.create(
                action_type="commission:create",
                model_name="CommissionEarning",
                record_id=None,
                organization_id=getattr(instance, "organization_id", None),
                branch_id=getattr(instance, "branch_id", None),
                agency_id=getattr(instance, "agency_id", None),
                user_id=getattr(instance, "created_by_id", None),
                description=f"Auto-created commission earnings for booking {booking_id}: {created_earnings}",
                status="success",
                new_data={"created_earnings": created_earnings},
            )
    except Exception:
        # avoid crashing booking save; errors should be visible in logs
        import traceback

        traceback.print_exc()
