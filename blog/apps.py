from django.apps import AppConfig


class BlogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'blog'
    verbose_name = 'Blog & Forms'
    
    def ready(self):
        # import signals to wire FormSubmission -> forwarding queue
        try:
            from . import signals  # noqa: F401
        except Exception:
            # keep app importable even if signals fail during management commands
            pass
