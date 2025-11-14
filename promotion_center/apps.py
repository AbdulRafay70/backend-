from django.apps import AppConfig


class PromotionCenterConfig(AppConfig):
    name = "promotion_center"
    verbose_name = "Promotion Center"

    def ready(self):
        # Import signal handlers
        try:
            from . import signals  # noqa: F401
        except Exception:
            # Avoid breaking migrations if signals depend on models that are not yet available
            pass
