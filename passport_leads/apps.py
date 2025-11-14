from django.apps import AppConfig


class PassportLeadsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'passport_leads'

    def ready(self):
        # import signals to register them
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
from django.apps import AppConfig


class PassportLeadsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'passport_leads'
    verbose_name = 'Passport Leads'

    def ready(self):
        # import signals
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
