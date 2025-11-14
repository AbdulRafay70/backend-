from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User, Group
from .models import UserProfile


# Unregister the default User admin
admin.site.unregister(User)
admin.site.unregister(Group)


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Custom User admin with renamed display"""
    
    class Meta:
        verbose_name = "Admin"
        verbose_name_plural = "Admins"
    
    # Keep all the default UserAdmin functionality
    pass


# Re-register Group with custom name
@admin.register(Group)
class CustomGroupAdmin(admin.ModelAdmin):
    search_fields = ('name',)
    filter_horizontal = ('permissions',)
    
    class Meta:
        verbose_name = "Employee Group"
        verbose_name_plural = "Employee Groups"


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ("id", "user", "type", "commission_id")
	search_fields = ("user__username", "commission_id")
	
	class Meta:
		verbose_name = "Employee Profile"
		verbose_name_plural = "Employee Profiles"
