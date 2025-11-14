from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from .models import UniversalRegistration, AuditLog
from django.forms.models import model_to_dict
from .notifications import notify_new_registration
from datetime import datetime, date
from django.db.models.fields.files import ImageFieldFile, FieldFile


def _make_json_safe(obj):
    """Recursively convert datetimes and file fields to JSON-serializable formats."""
    if isinstance(obj, dict):
        return {k: _make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_make_json_safe(v) for v in obj]
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    # Handle ImageField and FileField
    if isinstance(obj, (ImageFieldFile, FieldFile)):
        return obj.name if obj else None
    return obj


@receiver(pre_save, sender=UniversalRegistration)
def universal_presave(sender, instance, **kwargs):
    # attach previous state for update detection
    if instance.pk:
        try:
            prev = sender.objects.get(pk=instance.pk)
            # Exclude file fields from model_to_dict to avoid serialization issues
            instance._previous_state = model_to_dict(
                prev, 
                exclude=['cnic_front', 'cnic_back', 'visiting_card', 'dts_license']
            )
            # Add file fields manually as strings
            instance._previous_state['cnic_front'] = prev.cnic_front.name if prev.cnic_front else None
            instance._previous_state['cnic_back'] = prev.cnic_back.name if prev.cnic_back else None
            instance._previous_state['visiting_card'] = prev.visiting_card.name if prev.visiting_card else None
            instance._previous_state['dts_license'] = prev.dts_license if prev.dts_license else None
        except sender.DoesNotExist:
            instance._previous_state = None
    else:
        instance._previous_state = None


@receiver(post_save, sender=UniversalRegistration)
def universal_postsave(sender, instance, created, **kwargs):
    prev = getattr(instance, "_previous_state", None)
    
    # Exclude file fields from model_to_dict to avoid serialization issues
    new = model_to_dict(
        instance,
        exclude=['cnic_front', 'cnic_back', 'visiting_card', 'dts_license']
    )
    # Add file fields manually as strings
    new['cnic_front'] = instance.cnic_front.name if instance.cnic_front else None
    new['cnic_back'] = instance.cnic_back.name if instance.cnic_back else None
    new['visiting_card'] = instance.visiting_card.name if instance.visiting_card else None
    new['dts_license'] = instance.dts_license if instance.dts_license else None
    
    prev = _make_json_safe(prev) if prev is not None else None
    new = _make_json_safe(new)
    
    if created:
        AuditLog.objects.create(
            action=AuditLog.ACTION_CREATE,
            model_name=sender.__name__,
            object_id=str(instance.pk),
            previous_data=None,
            new_data=new,
        )
    else:
        AuditLog.objects.create(
            action=AuditLog.ACTION_UPDATE,
            model_name=sender.__name__,
            object_id=str(instance.pk),
            previous_data=prev,
            new_data=new,
        )
    # send optional notification on new registration
    if created:
        try:
            notify_new_registration(instance)
        except Exception:
            # notification failures shouldn't break saving
            pass


@receiver(pre_delete, sender=UniversalRegistration)
def universal_predelete(sender, instance, **kwargs):
    # Exclude file fields from model_to_dict to avoid serialization issues
    prev = model_to_dict(
        instance,
        exclude=['cnic_front', 'cnic_back', 'visiting_card', 'dts_license']
    )
    # Add file fields manually as strings
    prev['cnic_front'] = instance.cnic_front.name if instance.cnic_front else None
    prev['cnic_back'] = instance.cnic_back.name if instance.cnic_back else None
    prev['visiting_card'] = instance.visiting_card.name if instance.visiting_card else None
    prev['dts_license'] = instance.dts_license if instance.dts_license else None
    
    prev = _make_json_safe(prev)
    
    AuditLog.objects.create(
        action=AuditLog.ACTION_DELETE,
        model_name=sender.__name__,
        object_id=str(instance.pk),
        previous_data=prev,
        new_data=None,
    )
