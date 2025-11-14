from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from booking.models import Payment, Booking
from .utils import calculate_profit_loss
from django.forms.models import model_to_dict
from .models import Expense, FinancialRecord, AuditLog


@receiver(post_save, sender=Payment)
def payment_posted_update_profit(sender, instance: Payment, created, **kwargs):
    """When a payment is saved (especially completed), recalculate profit/loss for the booking."""
    try:
        # Only act if linked to booking
        if instance.booking_id:
            calculate_profit_loss(instance.booking_id)
    except Exception:
        # non-fatal
        pass


@receiver(post_save, sender=Booking)
def booking_saved_update_profit(sender, instance: Booking, created, **kwargs):
    """Recalculate profit/loss whenever a booking is saved (idempotent)."""
    try:
        calculate_profit_loss(instance.id)
    except Exception:
        pass


# Audit signals for Expense and FinancialRecord
def _sanitize_for_json(obj):
    from decimal import Decimal
    import datetime
    if obj is None:
        return None
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    return obj

@receiver(pre_save, sender=Expense)
def expense_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            before = model_to_dict(Expense.objects.get(pk=instance.pk))
            instance._audit_before = before
        except Expense.DoesNotExist:
            instance._audit_before = None
    else:
        instance._audit_before = None


@receiver(post_save, sender=Expense)
def expense_post_save(sender, instance, created, **kwargs):
    after = _sanitize_for_json(model_to_dict(instance))
    before = _sanitize_for_json(getattr(instance, '_audit_before', None))
    action = 'create' if created else 'update'
    try:
        AuditLog.objects.create(
            actor=getattr(instance, 'created_by', None),
            action=action,
            object_type='Expense',
            object_id=str(instance.id),
            before=before,
            after=after,
            reason='Expense create/update',
        )
    except Exception:
        pass


@receiver(post_delete, sender=Expense)
def expense_post_delete(sender, instance, **kwargs):
    try:
        AuditLog.objects.create(
            actor=getattr(instance, 'created_by', None),
            action='delete',
            object_type='Expense',
            object_id=str(instance.id),
            before=getattr(instance, '_audit_before', None),
            after=None,
            reason='Expense delete',
        )
    except Exception:
        pass


@receiver(pre_save, sender=FinancialRecord)
def fr_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            before = model_to_dict(FinancialRecord.objects.get(pk=instance.pk))
            instance._audit_before = before
        except FinancialRecord.DoesNotExist:
            instance._audit_before = None
    else:
        instance._audit_before = None


@receiver(post_save, sender=FinancialRecord)
def fr_post_save(sender, instance, created, **kwargs):
    after = _sanitize_for_json(model_to_dict(instance))
    before = _sanitize_for_json(getattr(instance, '_audit_before', None))
    action = 'create' if created else 'update'
    try:
        AuditLog.objects.create(
            actor=getattr(instance, 'created_by', None),
            action=action,
            object_type='FinancialRecord',
            object_id=str(instance.id),
            before=before,
            after=after,
            reason='FinancialRecord create/update',
        )
    except Exception:
        pass


@receiver(post_delete, sender=FinancialRecord)
def fr_post_delete(sender, instance, **kwargs):
    try:
        AuditLog.objects.create(
            actor=getattr(instance, 'created_by', None),
            action='delete',
            object_type='FinancialRecord',
            object_id=str(instance.id),
            before=getattr(instance, '_audit_before', None),
            after=None,
            reason='FinancialRecord delete',
        )
    except Exception:
        pass
