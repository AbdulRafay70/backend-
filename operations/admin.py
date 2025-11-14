from django.contrib import admin
from .models import RoomMap, HotelOperation, TransportOperation


@admin.register(RoomMap)
class RoomMapAdmin(admin.ModelAdmin):
    """Admin interface for RoomMap model"""
    
    list_display = [
        'room_no',
        'hotel',
        'floor_no',
        'beds',
        'room_type',
        'availability_status',
        'created_at'
    ]
    
    list_filter = [
        'availability_status',
        'floor_no',
        'hotel',
        'room_type',
        'created_at'
    ]
    
    search_fields = [
        'room_no',
        'hotel__name',
        'floor_no'
    ]
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Hotel & Room Information', {
            'fields': ('hotel', 'floor_no', 'room_no', 'room_type')
        }),
        ('Capacity & Status', {
            'fields': ('beds', 'availability_status')
        }),
        ('Audit Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize query with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('hotel', 'created_by')
    
    actions = ['mark_as_available', 'mark_as_occupied', 'mark_as_maintenance']
    
    def mark_as_available(self, request, queryset):
        """Bulk action to mark rooms as available"""
        updated = queryset.update(availability_status='available')
        self.message_user(request, f'{updated} room(s) marked as available.')
    mark_as_available.short_description = 'Mark selected rooms as Available'
    
    def mark_as_occupied(self, request, queryset):
        """Bulk action to mark rooms as occupied"""
        updated = queryset.update(availability_status='occupied')
        self.message_user(request, f'{updated} room(s) marked as occupied.')
    mark_as_occupied.short_description = 'Mark selected rooms as Occupied'
    
    def mark_as_maintenance(self, request, queryset):
        """Bulk action to mark rooms as under maintenance"""
        updated = queryset.update(availability_status='maintenance')
        self.message_user(request, f'{updated} room(s) marked as under maintenance.')
    mark_as_maintenance.short_description = 'Mark selected rooms as Maintenance'


@admin.register(HotelOperation)
class HotelOperationAdmin(admin.ModelAdmin):
    """Admin interface for HotelOperation model"""
    
    list_display = [
        'booking_id_str',
        'pax_full_name',
        'hotel_name',
        'city',
        'room_no',
        'bed_no',
        'date',
        'check_in_date',
        'check_out_date',
        'status',
        'updated_at'
    ]
    
    list_filter = [
        'status',
        'city',
        'date',
        'check_in_date',
        'check_out_date',
        'hotel',
        'created_at'
    ]
    
    search_fields = [
        'booking_id_str',
        'pax_id_str',
        'pax_first_name',
        'pax_last_name',
        'hotel_name',
        'room_no',
        'contact_no'
    ]
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Booking & Pax Information', {
            'fields': (
                'booking',
                'booking_id_str',
                'pax',
                'pax_id_str',
                'pax_first_name',
                'pax_last_name',
                'contact_no',
                'family_head_contact'
            )
        }),
        ('Hotel & Room Assignment', {
            'fields': (
                'hotel',
                'hotel_name',
                'city',
                'room',
                'room_no',
                'bed_no'
            )
        }),
        ('Date & Status', {
            'fields': (
                'date',
                'check_in_date',
                'check_out_date',
                'status',
                'notes'
            )
        }),
        ('Audit Information', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize query with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related(
            'booking',
            'pax',
            'hotel',
            'room',
            'created_by',
            'updated_by'
        )
    
    def pax_full_name(self, obj):
        """Display full name of pax"""
        return f"{obj.pax_first_name} {obj.pax_last_name}"
    pax_full_name.short_description = 'Passenger Name'
    
    actions = [
        'mark_as_checked_in',
        'mark_as_checked_out',
        'mark_as_pending',
        'mark_as_canceled'
    ]
    
    def mark_as_checked_in(self, request, queryset):
        """Bulk action to mark operations as checked in"""
        updated = 0
        for operation in queryset:
            operation.mark_checked_in(user=request.user)
            updated += 1
        self.message_user(request, f'{updated} operation(s) marked as checked in.')
    mark_as_checked_in.short_description = 'Mark as Checked In'
    
    def mark_as_checked_out(self, request, queryset):
        """Bulk action to mark operations as checked out"""
        updated = 0
        for operation in queryset:
            operation.mark_checked_out(user=request.user)
            updated += 1
        self.message_user(request, f'{updated} operation(s) marked as checked out.')
    mark_as_checked_out.short_description = 'Mark as Checked Out'
    
    def mark_as_pending(self, request, queryset):
        """Bulk action to mark operations as pending"""
        updated = queryset.update(status='pending')
        self.message_user(request, f'{updated} operation(s) marked as pending.')
    mark_as_pending.short_description = 'Mark as Pending'
    
    def mark_as_canceled(self, request, queryset):
        """Bulk action to cancel operations"""
        updated = 0
        for operation in queryset:
            operation.cancel_operation(user=request.user)
            updated += 1
        self.message_user(request, f'{updated} operation(s) canceled.')
    mark_as_canceled.short_description = 'Cancel Operations'


@admin.register(TransportOperation)
class TransportOperationAdmin(admin.ModelAdmin):
    """Admin interface for TransportOperation model"""
    
    list_display = [
        'booking_id_str',
        'pax_full_name',
        'pickup_location',
        'drop_location',
        'vehicle_name',
        'driver_name',
        'date',
        'pickup_time',
        'status',
        'updated_at'
    ]
    
    list_filter = [
        'status',
        'date',
        'vehicle',
        'pickup_location',
        'drop_location',
        'created_at'
    ]
    
    search_fields = [
        'booking_id_str',
        'pax_id_str',
        'pax_first_name',
        'pax_last_name',
        'pickup_location',
        'drop_location',
        'driver_name',
        'contact_no'
    ]
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Booking & Pax Information', {
            'fields': (
                'booking',
                'booking_id_str',
                'pax',
                'pax_id_str',
                'pax_first_name',
                'pax_last_name',
                'contact_no'
            )
        }),
        ('Transport Details', {
            'fields': (
                'pickup_location',
                'drop_location',
                'vehicle',
                'vehicle_name',
                'driver_name',
                'driver_contact'
            )
        }),
        ('Date & Time', {
            'fields': (
                'date',
                'pickup_time',
                'actual_pickup_time',
                'actual_drop_time'
            )
        }),
        ('Status & Notes', {
            'fields': (
                'status',
                'notes'
            )
        }),
        ('Audit Information', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize query with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related(
            'booking',
            'pax',
            'vehicle',
            'created_by',
            'updated_by'
        )
    
    def pax_full_name(self, obj):
        """Display full name of pax"""
        return f"{obj.pax_first_name} {obj.pax_last_name}"
    pax_full_name.short_description = 'Passenger Name'
    
    actions = [
        'mark_as_departed',
        'mark_as_arrived',
        'mark_as_pending',
        'mark_as_canceled'
    ]
    
    def mark_as_departed(self, request, queryset):
        """Bulk action to mark operations as departed"""
        updated = 0
        for operation in queryset:
            operation.mark_departed(user=request.user)
            updated += 1
        self.message_user(request, f'{updated} operation(s) marked as departed.')
    mark_as_departed.short_description = 'Mark as Departed'
    
    def mark_as_arrived(self, request, queryset):
        """Bulk action to mark operations as arrived"""
        updated = 0
        for operation in queryset:
            operation.mark_arrived(user=request.user)
            updated += 1
        self.message_user(request, f'{updated} operation(s) marked as arrived.')
    mark_as_arrived.short_description = 'Mark as Arrived'
    
    def mark_as_pending(self, request, queryset):
        """Bulk action to mark operations as pending"""
        updated = queryset.update(status='pending')
        self.message_user(request, f'{updated} operation(s) marked as pending.')
    mark_as_pending.short_description = 'Mark as Pending'
    
    def mark_as_canceled(self, request, queryset):
        """Bulk action to cancel operations"""
        updated = 0
        for operation in queryset:
            operation.cancel_operation(user=request.user)
            updated += 1
        self.message_user(request, f'{updated} operation(s) canceled.')
    mark_as_canceled.short_description = 'Cancel Operations'

