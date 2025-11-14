"""
Custom Django Admin Site Configuration
Customizes the display names and organization of admin sections
"""
from django.contrib import admin
from django.contrib.auth.models import User, Group


# Change the site header and titles
admin.site.site_header = "SAER.PK Administration"
admin.site.site_title = "SAER.PK Admin Portal"
admin.site.index_title = "Welcome to SAER.PK Administration"


# Customize model display names by modifying their Meta
def customize_model_names():
    """Customize the verbose names of models in Django Admin"""
    
    # Customize User model
    User._meta.verbose_name = "Admin"
    User._meta.verbose_name_plural = "Admins"
    
    # Customize Group model
    Group._meta.verbose_name = "Employee Group"
    Group._meta.verbose_name_plural = "Employee Groups"


# Call the customization function
customize_model_names()
