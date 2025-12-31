from django.contrib import admin
from .models import (
    PaxMovement, AirportTransfer, AirportTransferPax,
    Transport, TransportPax, Ziyarat, ZiyaratPax,
    FoodService, FoodServicePax
)


@admin.register(PaxMovement)
class PaxMovementAdmin(admin.ModelAdmin):
    list_display = ['pax_id', 'person_name', 'booking_number', 'status', 'current_city', 'exit_verification', 'created_at']
    list_filter = ['status', 'exit_verification', 'current_city', 'created_at']
    search_fields = ['pax_id', 'person__first_name', 'person__last_name', 'booking__booking_number']
    readonly_fields = ['pax_id', 'created_at', 'updated_at']
    
    # Note: Some model fields are excluded from admin because they don't exist in database yet
    # Fields excluded: departure_airport, arrival_airport, passport_number, passport_expiry, 
    # organization, agent, reported_to_shirka, shirka_report_date
    # To add them, run migration 0002 properly (currently fake-applied)
    
    def get_queryset(self, request):
        """
        Override queryset to defer non-existent fields.
        These fields are defined in the model but don't exist in the database
        because migration 0002 was fake-applied.
        """
        qs = super().get_queryset(request)
        # Defer fields that don't exist in database
        return qs.defer(
            'departure_airport',
            'arrival_airport', 
            'passport_number',
            'passport_expiry',
            'organization',
            'agent',
            'reported_to_shirka',
            'shirka_report_date'
        )
    
    fieldsets = (
        ('Passenger Information', {
            'fields': ('pax_id', 'booking', 'person')
        }),
        ('Movement Status', {
            'fields': ('status', 'current_city', 'entry_date', 'exit_date')
        }),
        ('Flight Information', {
            'fields': ('flight_number_to_ksa', 'flight_date_to_ksa', 'flight_number_from_ksa', 'flight_date_from_ksa')
        }),
        ('Verification', {
            'fields': ('exit_verification', 'verified_by', 'verified_at')
        }),
        ('Notifications', {
            'fields': ('agent_notified', 'last_notification_sent')
        }),
        ('Tracking', {
            'fields': ('created_at', 'updated_at', 'updated_by')
        }),
    )
    
    def person_name(self, obj):
        return f"{obj.person.first_name} {obj.person.last_name}"
    person_name.short_description = 'Passenger Name'
    
    def booking_number(self, obj):
        return obj.booking.booking_number
    booking_number.short_description = 'Booking'


class AirportTransferPaxInline(admin.TabularInline):
    model = AirportTransferPax
    extra = 0
    readonly_fields = ['updated_at']


@admin.register(AirportTransfer)
class AirportTransferAdmin(admin.ModelAdmin):
    list_display = ['booking', 'transfer_type', 'flight_number', 'flight_date', 'flight_time', 'status']
    list_filter = ['transfer_type', 'status', 'flight_date']
    search_fields = ['booking__booking_number', 'flight_number']
    inlines = [AirportTransferPaxInline]
    
    fieldsets = (
        ('Booking', {
            'fields': ('booking',)
        }),
        ('Transfer Details', {
            'fields': ('transfer_type', 'flight_number', 'flight_date', 'flight_time')
        }),
        ('Locations', {
            'fields': ('pickup_point', 'drop_point')
        }),
        ('Vehicle', {
            'fields': ('vehicle_type', 'vehicle_number', 'driver_name', 'driver_contact')
        }),
        ('Status & Timing', {
            'fields': ('status', 'scheduled_time', 'actual_departure_time', 'actual_arrival_time')
        }),
        ('Additional Info', {
            'fields': ('remarks', 'updated_by')
        }),
    )


class TransportPaxInline(admin.TabularInline):
    model = TransportPax
    extra = 0
    readonly_fields = ['updated_at']


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ['booking', 'pickup_location', 'drop_location', 'scheduled_date', 'status']
    list_filter = ['status', 'scheduled_date', 'pickup_city', 'drop_city']
    search_fields = ['booking__booking_number', 'pickup_location', 'drop_location']
    inlines = [TransportPaxInline]
    
    fieldsets = (
        ('Booking', {
            'fields': ('booking',)
        }),
        ('Route', {
            'fields': ('pickup_location', 'pickup_city', 'drop_location', 'drop_city')
        }),
        ('Schedule', {
            'fields': ('scheduled_date', 'scheduled_time', 'actual_departure_time', 'actual_arrival_time')
        }),
        ('Vehicle', {
            'fields': ('vehicle_type', 'vehicle_number', 'driver_name', 'driver_contact')
        }),
        ('Status', {
            'fields': ('status', 'remarks', 'updated_by')
        }),
    )


class ZiyaratPaxInline(admin.TabularInline):
    model = ZiyaratPax
    extra = 0
    readonly_fields = ['updated_at']


@admin.register(Ziyarat)
class ZiyaratAdmin(admin.ModelAdmin):
    list_display = ['booking', 'location', 'city', 'scheduled_date', 'pickup_time', 'status']
    list_filter = ['status', 'scheduled_date', 'city']
    search_fields = ['booking__booking_number', 'location']
    inlines = [ZiyaratPaxInline]
    
    fieldsets = (
        ('Booking', {
            'fields': ('booking',)
        }),
        ('Location', {
            'fields': ('location', 'city')
        }),
        ('Schedule', {
            'fields': ('scheduled_date', 'pickup_time', 'expected_return_time', 'actual_start_time', 'actual_end_time')
        }),
        ('Transport', {
            'fields': ('vehicle_type', 'vehicle_number', 'guide_name', 'guide_contact')
        }),
        ('Status', {
            'fields': ('status', 'remarks', 'updated_by')
        }),
    )


class FoodServicePaxInline(admin.TabularInline):
    model = FoodServicePax
    extra = 0
    readonly_fields = ['updated_at']


@admin.register(FoodService)
class FoodServiceAdmin(admin.ModelAdmin):
    list_display = ['booking', 'meal_type', 'service_date', 'service_time', 'location', 'status']
    list_filter = ['meal_type', 'status', 'service_date', 'city']
    search_fields = ['booking__booking_number', 'location', 'menu']
    inlines = [FoodServicePaxInline]
    
    fieldsets = (
        ('Booking', {
            'fields': ('booking',)
        }),
        ('Meal Details', {
            'fields': ('meal_type', 'menu')
        }),
        ('Schedule', {
            'fields': ('service_date', 'service_time', 'actual_service_time')
        }),
        ('Location', {
            'fields': ('location', 'hotel', 'city')
        }),
        ('Status', {
            'fields': ('status', 'remarks', 'updated_by')
        }),
    )
