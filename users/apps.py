from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    verbose_name = 'Admin and Employees'
    
    def ready(self):
        """Import admin config when app is ready"""
        from . import admin_config
