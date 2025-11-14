from django.apps import AppConfig


class LedgerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ledger"

    def ready(self):
        # import signal handlers
        try:
            import ledger.signals  # noqa: F401
        except Exception:
            # don't crash on import errors during migrations
            pass
