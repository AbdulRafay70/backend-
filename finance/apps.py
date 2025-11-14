from django.apps import AppConfig


class FinanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance'

    def ready(self):
        # import signals
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
