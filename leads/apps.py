from django.apps import AppConfig


class LeadsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "leads"

    def ready(self):
        # import signals to connect booking post_save
        try:
            import leads.signals  # noqa: F401
        except Exception:
            # avoid breaking manage commands if imports fail
            pass
