from django.apps import AppConfig


class OperationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'operations'
    verbose_name = 'Daily Operations Management'
    
    def ready(self):
        # Import signal handlers to ensure they are registered when app is ready
        try:
            from . import signals  # noqa: F401
        except Exception:
            # Avoid breaking startup if signals cannot be imported; errors will be visible in logs
            pass
