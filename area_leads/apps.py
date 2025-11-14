from django.apps import AppConfig


class AreaLeadsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "area_leads"

    def ready(self):
        # import signals
        try:
            import area_leads.signals  # noqa: F401
        except Exception:
            pass
