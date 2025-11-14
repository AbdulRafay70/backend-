from django.apps import AppConfig


class OrganizationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'organization'

    def ready(self):
        # Import signals to ensure post_save handlers for User are registered
        try:
            from . import signals  # noqa: F401
        except Exception:
            # If signals fail to import, don't crash app startup; errors will show in logs
            pass
