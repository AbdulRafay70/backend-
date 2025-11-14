from django.apps import AppConfig


class PaxMovementsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pax_movements'
    verbose_name = 'Passenger Movement & Travel Management'
    
    def ready(self):
        import pax_movements.signals  # Import signals when app is ready
