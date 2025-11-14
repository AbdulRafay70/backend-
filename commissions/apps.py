from django.apps import AppConfig


class CommissionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "commissions"

    def ready(self):
        # import signals when app is ready
        try:
            import commissions.signals  # noqa: F401
        except Exception:
            pass
