from django.contrib import admin
from django.utils.html import format_html
from .models import (
	UmrahPackage,
	UmrahPackageHotelDetails,
	UmrahPackageTicketDetails,
	UmrahPackageTransportDetails,
	UmrahPackageDiscountDetails,
	CustomUmrahPackage,
	CustomUmrahPackageHotelDetails,
	CustomUmrahPackageTicketDetails,
	CustomUmrahPackageTransportDetails,
	Visa,
	TransportSectorPrice,
	Airlines,
	City,
)


# Inline classes for Custom Umrah Package
class CustomUmrahPackageHotelDetailsInline(admin.TabularInline):
    model = CustomUmrahPackageHotelDetails
    extra = 1
    fields = ('hotel', 'room_type', 'quantity', 'sharing_type', 'check_in_date', 'check_out_date', 'number_of_nights', 'price')


class CustomUmrahPackageTicketDetailsInline(admin.TabularInline):
    model = CustomUmrahPackageTicketDetails
    extra = 1


class CustomUmrahPackageTransportDetailsInline(admin.TabularInline):
    model = CustomUmrahPackageTransportDetails
    extra = 1


@admin.register(CustomUmrahPackage)
class CustomUmrahPackageAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'agency', 
        'display_user_employee', 
        'total_adaults', 
        'total_children', 
        'total_infants',
        'status_badge',
        'created_at'
    )
    list_filter = ('status', 'created_at', 'only_visa', 'long_term_stay', 'is_full_transport')
    search_fields = ('id', 'agency__name', 'user__username', 'user__email', 'user__employee_profile__first_name', 'user__employee_profile__last_name')
    readonly_fields = ('created_at', 'updated_at', 'display_employee_details')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('organization', 'agency', 'user', 'display_employee_details')
        }),
        ('Package Details', {
            'fields': (
                'total_adaults', 
                'total_children', 
                'total_infants',
                'adault_visa_price',
                'child_visa_price',
                'infant_visa_price',
            )
        }),
        ('Package Options', {
            'fields': (
                'long_term_stay',
                'is_full_transport',
                'is_one_side_transport',
                'only_visa',
            )
        }),
        ('Status & Timestamps', {
            'fields': ('status', 'created_at', 'updated_at')
        }),
    )
    
    inlines = [
        CustomUmrahPackageHotelDetailsInline,
        CustomUmrahPackageTicketDetailsInline,
        CustomUmrahPackageTransportDetailsInline,
    ]
    
    def display_user_employee(self, obj):
        """Display user with employee name if available"""
        if obj.user:
            try:
                if hasattr(obj.user, 'employee_profile'):
                    emp = obj.user.employee_profile
                    return f"{emp.first_name} {emp.last_name} ({emp.employee_code})"
                else:
                    return obj.user.username
            except:
                return obj.user.username
        return "-"
    display_user_employee.short_description = "Employee/User"
    
    def display_employee_details(self, obj):
        """Display detailed employee information"""
        if obj.user:
            try:
                if hasattr(obj.user, 'employee_profile'):
                    emp = obj.user.employee_profile
                    return format_html(
                        '<div style="padding: 10px; background-color: #f8f9fa; border-radius: 5px;">'
                        '<strong>Employee Code:</strong> {}<br>'
                        '<strong>Name:</strong> {} {}<br>'
                        '<strong>Email:</strong> {}<br>'
                        '<strong>Phone:</strong> {}<br>'
                        '<strong>Position:</strong> {}<br>'
                        '<strong>Status:</strong> {}'
                        '</div>',
                        emp.employee_code or 'N/A',
                        emp.first_name,
                        emp.last_name,
                        emp.email,
                        emp.phone_number or 'N/A',
                        emp.get_position_display() if hasattr(emp, 'position') else 'N/A',
                        emp.get_status_display()
                    )
                else:
                    return format_html(
                        '<div style="padding: 10px; background-color: #fff3cd; border-radius: 5px;">'
                        '<strong>Username:</strong> {}<br>'
                        '<strong>Email:</strong> {}<br>'
                        '<em>No employee profile linked</em>'
                        '</div>',
                        obj.user.username,
                        obj.user.email
                    )
            except Exception as e:
                return format_html('<span style="color: red;">Error loading employee data: {}</span>', str(e))
        return format_html('<span style="color: gray;">No user assigned</span>')
    display_employee_details.short_description = "Employee Details"
    
    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            'pending': '#ffc107',
            'confirmed': '#28a745',
            'processing': '#17a2b8',
            'completed': '#6c757d',
            'cancelled': '#dc3545',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Status"
    
    def get_queryset(self, request):
        """Optimize queries by selecting related employee data"""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'user__employee_profile', 'agency', 'organization')


@admin.register(UmrahPackage)
class UmrahPackageAdmin(admin.ModelAdmin):
    list_display = ('id', 'package_code', 'title', 'package_type', 'status', 'max_capacity', 'left_seats', 'is_public')
    list_filter = ('package_type', 'status', 'is_public', 'created_at')
    search_fields = ('package_code', 'title', 'description')
    readonly_fields = ('package_code', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Package Information', {
            'fields': ('package_code', 'title', 'description', 'package_type', 'status')
        }),
        ('Pricing & Dates', {
            'fields': ('start_date', 'end_date', 'profit_percent')
        }),
        ('Capacity', {
            'fields': ('max_capacity', 'booked_seats', 'left_seats')
        }),
        ('Visibility', {
            'fields': ('is_public', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(Visa)
class VisaAdmin(admin.ModelAdmin):
    list_display = ('visa_id', 'visa_type', 'country', 'status', 'adult_price', 'issue_date', 'expiry_date')
    list_filter = ('status', 'visa_type', 'country', 'created_at')
    search_fields = ('visa_id', 'service_provider', 'notes')
    readonly_fields = ('visa_id', 'application_date', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Visa Information', {
            'fields': ('visa_id', 'organization', 'visa_type', 'country', 'status')
        }),
        ('Provider Details', {
            'fields': ('service_provider', 'service_provider_contact')
        }),
        ('Dates', {
            'fields': ('application_date', 'issue_date', 'expiry_date', 'validity_days')
        }),
        ('Pricing', {
            'fields': ('price', 'adult_price', 'child_price', 'infant_price')
        }),
        ('Additional Info', {
            'fields': ('notes', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(TransportSectorPrice)
class TransportSectorPriceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'reference', 'organization', 'vehicle_type', 'adault_price', 'child_price', 'infant_price', 'is_visa', 'only_transport_charge')
    list_filter = ('organization', 'is_visa', 'only_transport_charge', 'vehicle_type')
    search_fields = ('name', 'reference')
    
    fieldsets = (
        ('Transport Information', {
            'fields': ('organization', 'name', 'reference', 'vehicle_type')
        }),
        ('Pricing', {
            'fields': ('adault_price', 'child_price', 'infant_price')
        }),
        ('Options', {
            'fields': ('is_visa', 'only_transport_charge')
        }),
    )


@admin.register(Airlines)
class AirlinesAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'organization', 'is_umrah_seat')
    list_filter = ('organization', 'is_umrah_seat')
    search_fields = ('name', 'code')
    
    fieldsets = (
        ('Airline Information', {
            'fields': ('organization', 'name', 'code', 'logo', 'is_umrah_seat')
        }),
    )


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'organization')
    list_filter = ('organization',)
    search_fields = ('name', 'code')
    
    fieldsets = (
        ('City Information', {
            'fields': ('organization', 'name', 'code')
        }),
    )


# Remove the simple registrations for models that now have admin classes
# admin.site.register(UmrahPackage)  # Now using @admin.register decorator
admin.site.register(UmrahPackageHotelDetails)
admin.site.register(UmrahPackageTicketDetails)
admin.site.register(UmrahPackageTransportDetails)
admin.site.register(UmrahPackageDiscountDetails)
# Custom package related models are registered via decorator above
admin.site.register(CustomUmrahPackageHotelDetails)
admin.site.register(CustomUmrahPackageTicketDetails)
admin.site.register(CustomUmrahPackageTransportDetails)

