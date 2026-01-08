from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User, Group
from .models import UserProfile


# Unregister the default User admin
admin.site.unregister(User)
admin.site.unregister(Group)


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Custom User admin with clean display - no organization details"""
    
    # Display only user-related fields, not organization details
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_user_type', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('-is_staff', 'username')  # Sort by user type (Admins first), then username
    
    def get_user_type(self, obj):
        """Display user type based on is_staff status"""
        if obj.is_staff:
            return "Admin"
        else:
            return "Agent"
    get_user_type.short_description = "User Type"
    get_user_type.admin_order_field = 'is_staff'  # Allow sorting by this column
    
    class Meta:
        verbose_name = "Admin"
        verbose_name_plural = "Admins"


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
