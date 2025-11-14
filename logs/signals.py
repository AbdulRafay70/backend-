from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.apps import apps
from .models import SystemLog
from django.forms.models import model_to_dict
from .utils import _sanitize_payload


# small in-memory cache for pre-save snapshots (process-local)
_PRE_SAVE_CACHE = {}


def _safe_model_dict(instance):
    try:
        return model_to_dict(instance)
    except Exception:
        # fallback: try to build simple dict
        return {f.name: getattr(instance, f.name, None) for f in instance._meta.fields}


@receiver(pre_save)
def generic_pre_save_snapshot(sender, instance, **kwargs):
    """Capture previous state before save so post_save can include old_data."""
    try:
        app_label = getattr(sender._meta, "app_label", None)
        watched_apps = {"booking", "ledger", "organization", "users", "packages", "tickets", "payment", "branch"}
        if app_label not in watched_apps:
            return

        pk = getattr(instance, "pk", None)
        if not pk:
            return

        try:
            previous = sender.objects.filter(pk=pk).first()
        except Exception:
            previous = None

        if previous is not None:
            _PRE_SAVE_CACHE[(sender, pk)] = _safe_model_dict(previous)
    except Exception:
        pass


@receiver(post_save)
def generic_post_save_logger(sender, instance, created, **kwargs):
    # Only handle a limited set of apps to avoid excessive logs.
    app_label = getattr(sender._meta, "app_label", None)
    model_name = getattr(sender._meta, "object_name", str(sender))
    watched_apps = {"booking", "ledger", "organization", "users", "packages", "tickets"}
    if app_label not in watched_apps:
        return

    action = f"CREATE_{model_name.upper()}" if created else f"UPDATE_{model_name.upper()}"

    # try to attach old_data captured at pre_save
    old_data = None
    try:
        pk = getattr(instance, "pk", None)
        old_data = _PRE_SAVE_CACHE.pop((sender, pk), None)
    except Exception:
        old_data = None

    SystemLog.objects.create(
        action_type=action,
        model_name=model_name,
        record_id=getattr(instance, "id", None),
        organization_id=getattr(instance, "organization_id", None),
        branch_id=getattr(instance, "branch_id", None),
        user_id=getattr(instance, "created_by_id", None) or getattr(instance, "user_id", None),
        description=f"{model_name} #{getattr(instance, 'id', '')} {'created' if created else 'updated'}",
        status="success",
        old_data=_sanitize_payload(old_data) if old_data is not None else None,
        new_data=_sanitize_payload(_safe_model_dict(instance)),
    )


@receiver(post_delete)
def generic_post_delete_logger(sender, instance, **kwargs):
    app_label = getattr(sender._meta, "app_label", None)
    model_name = getattr(sender._meta, "object_name", str(sender))
    watched_apps = {"booking", "ledger", "organization", "users", "packages", "tickets"}
    if app_label not in watched_apps:
        return

    SystemLog.objects.create(
        action_type=f"DELETE_{model_name.upper()}",
        model_name=model_name,
        record_id=getattr(instance, "id", None),
        organization_id=getattr(instance, "organization_id", None),
        branch_id=getattr(instance, "branch_id", None),
        user_id=None,
        description=f"{model_name} #{getattr(instance, 'id', '')} deleted",
        status="success",
        old_data=_sanitize_payload(_safe_model_dict(instance)),
    )
