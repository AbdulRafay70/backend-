from django.apps import AppConfig


class CommissionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "commissions"

    def ready(self):
        # import signals when app is ready
        try:
            print("Attempting to load commissions.signals...")
            import commissions.signals  # noqa: F401
            print("Successfully loaded commissions.signals")
        except Exception as e:
            print(f"FAILED to load commissions.signals: {e}")
            import traceback
            traceback.print_exc()
