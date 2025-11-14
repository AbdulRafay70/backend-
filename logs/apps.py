from django.apps import AppConfig


class LogsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "logs"

    def ready(self):
        # import signal registrations
        try:
            import logs.signals  # noqa: F401
        except Exception:
            # avoid breaking startup if signals cannot be imported in some contexts
            pass
