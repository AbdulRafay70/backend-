from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'customers'

    def ready(self):
        # import signals to ensure they're registered
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
