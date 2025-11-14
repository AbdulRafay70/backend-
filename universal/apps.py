from django.apps import AppConfig


class UniversalConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "universal"

    def ready(self):
        # Import signals to ensure they are registered
        from . import signals  # noqa: F401
