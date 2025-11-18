from django.apps import AppConfig


class BookingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'booking'
    def ready(self):
        # import signal handlers
        try:
            from . import signals  # noqa: F401
        except Exception:
            # avoid crashing if signals fail to import during migrations
            pass
