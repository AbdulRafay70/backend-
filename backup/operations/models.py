from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from tickets.models import Hotels
from booking.models import Booking, BookingPersonDetail, VehicleType


class RoomMap(models.Model):
    """
    Master data model for hotel room inventory mapping.
    Maps rooms by floor, availability, and hotel.
    Used for room allocation in HotelOperation API.
    """
    
    AVAILABILITY_STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('cleaning_pending', 'Cleaning Pending'),
        ('maintenance', 'Under Maintenance'),
        ('reserved', 'Reserved'),
        ('blocked', 'Blocked'),
    ]
    
    # Hotel reference
    hotel = models.ForeignKey(
        Hotels,
        on_delete=models.CASCADE,
        related_name='room_mappings',
        help_text="Hotel to which this room belongs"
    )
    
    # Room details
    floor_no = models.CharField(
        max_length=10,
        help_text="Floor number (e.g., 'G', '1', '2', 'M' for mezzanine)"
    )
    room_no = models.CharField(
        max_length=20,
        help_text="Room number (e.g., '101', '202A')"
    )
    
    # Capacity
    beds = models.IntegerField(
        default=1,
        help_text="Total number of beds in this room"
    )
    
    # Availability
    availability_status = models.CharField(
        max_length=20,
        choices=AVAILABILITY_STATUS_CHOICES,
        default='available',
        help_text="Current availability status of the room"
    )
    
    # Additional info
    room_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Room type (e.g., 'Single', 'Double', 'Suite')"
    )
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='room_maps_created'
    )
    
    class Meta:
        db_table = 'operations_roommap'
        ordering = ['hotel', 'floor_no', 'room_no']
        unique_together = ['hotel', 'room_no']  # Ensure unique room numbers per hotel
        indexes = [
            models.Index(fields=['hotel', 'availability_status']),
            models.Index(fields=['floor_no', 'room_no']),
        ]
        verbose_name = 'Room Map'
        verbose_name_plural = 'Room Maps'
    
    def __str__(self):
        return f"{self.hotel.name} - Floor {self.floor_no} - Room {self.room_no}"
    
    def mark_occupied(self):
        """Mark room as occupied"""
        self.availability_status = 'occupied'
        self.save()
    
    def mark_available(self):
        """Mark room as available"""
        self.availability_status = 'available'
        self.save()


class HotelOperation(models.Model):
    """
    Tracks daily hotel check-in/check-out operations for pax (passengers).
    Links bookings to room assignments and tracks operation status.
    Supports date-based filtering for daily operation management.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('canceled', 'Canceled'),
    ]
    
    # Booking and Pax references
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='hotel_operations',
        help_text="Booking reference"
    )
    pax = models.ForeignKey(
        BookingPersonDetail,
        on_delete=models.CASCADE,
        related_name='hotel_operations',
        help_text="Passenger/person details from booking"
    )
    
    # Mandatory pax identification fields (denormalized for quick access)
    pax_id_str = models.CharField(
        max_length=50,
        help_text="Passenger ID from BookingPersonDetail"
    )
    pax_first_name = models.CharField(
        max_length=100,
        help_text="Passenger first name"
    )
    pax_last_name = models.CharField(
        max_length=100,
        help_text="Passenger last name"
    )
    booking_id_str = models.CharField(
        max_length=50,
        help_text="Booking ID for quick reference"
    )
    
    # Contact information
    contact_no = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Passenger contact number"
    )
    family_head_contact = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Family head contact number"
    )
    
    # Hotel and Room assignment
    hotel = models.ForeignKey(
        Hotels,
        on_delete=models.CASCADE,
        related_name='hotel_operations',
        help_text="Hotel where pax is staying"
    )
    hotel_name = models.CharField(
        max_length=200,
        help_text="Hotel name (denormalized)"
    )
    city = models.CharField(
        max_length=100,
        help_text="City where hotel is located (e.g., Makkah, Madinah)"
    )
    
    # Room allocation
    room = models.ForeignKey(
        RoomMap,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hotel_operations',
        help_text="Room assigned to pax"
    )
    room_no = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Room number (denormalized from RoomMap)"
    )
    bed_no = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Bed number within the room"
    )
    
    # Date tracking
    date = models.DateField(
        help_text="Operation date for daily tracking (check-in or check-out date)"
    )
    check_in_date = models.DateField(
        help_text="Scheduled/actual check-in date"
    )
    check_out_date = models.DateField(
        help_text="Scheduled/actual check-out date"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current operation status"
    )
    
    # Audit fields
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes or remarks"
    )
    # housekeeping flag to indicate housekeeping completed after checkout
    housekeeping_done = models.BooleanField(default=False, help_text="Set true when housekeeping marks cleaning done for this operation")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hotel_operations_created'
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hotel_operations_updated'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'operations_hoteloperations'
        ordering = ['date', 'hotel', 'booking']
        indexes = [
            models.Index(fields=['date', 'status']),
            models.Index(fields=['booking', 'pax']),
            models.Index(fields=['hotel', 'date']),
            models.Index(fields=['check_in_date']),
            models.Index(fields=['check_out_date']),
            models.Index(fields=['pax_id_str']),
            models.Index(fields=['booking_id_str']),
        ]
        verbose_name = 'Hotel Operation'
        verbose_name_plural = 'Hotel Operations'
    
    def __str__(self):
        return f"{self.booking_id_str} - {self.pax_first_name} {self.pax_last_name} - {self.hotel_name} ({self.date})"
    
    def mark_checked_in(self, user=None):
        """Mark pax as checked in"""
        self.status = 'checked_in'
        if user:
            self.updated_by = user
        self.save()
        
        # Mark room as occupied if assigned
        if self.room:
            self.room.mark_occupied()
    
    def mark_checked_out(self, user=None):
        """Mark pax as checked out"""
        self.status = 'checked_out'
        if user:
            self.updated_by = user
        self.save()
        
        # Mark room as available if assigned
        if self.room:
            self.room.mark_available()
    
    def cancel_operation(self, user=None):
        """Cancel the operation"""
        self.status = 'canceled'
        if user:
            self.updated_by = user
        self.save()
        
        # Mark room as available if assigned
        if self.room:
            self.room.mark_available()


class OperationLog(models.Model):
    """Persistent audit log for operations like manual overrides and housekeeping."""
    ACTION_CHOICES = [
        ('manual_override', 'Manual Override'),
        ('cleaning_done', 'Cleaning Done'),
        ('assign', 'Assign Bed'),
        ('free', 'Free Bed'),
    ]

    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    room = models.ForeignKey(
        RoomMap, on_delete=models.SET_NULL, null=True, blank=True, related_name='operation_logs'
    )
    hotel = models.ForeignKey(
        Hotels, on_delete=models.SET_NULL, null=True, blank=True, related_name='operation_logs'
    )
    performed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='operation_logs'
    )
    performed_by_username = models.CharField(max_length=150, blank=True, null=True)
    prev_status = models.CharField(max_length=50, blank=True, null=True)
    new_status = models.CharField(max_length=50, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'operations_operationlog'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_action_display()} - Room {self.room_id if self.room_id else 'N/A'} @ {self.created_at}"


class TransportOperation(models.Model):
    """
    Tracks daily transport operations (pickup/drop) for pax (passengers).
    Manages city or intercity transfers between hotels or cities.
    Supports date-based filtering for daily transport job management.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('departed', 'Departed'),
        ('arrived', 'Arrived'),
        ('canceled', 'Canceled'),
    ]
    
    # Booking and Pax references
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='transport_operations',
        help_text="Booking reference"
    )
    pax = models.ForeignKey(
        BookingPersonDetail,
        on_delete=models.CASCADE,
        related_name='transport_operations',
        help_text="Passenger/person details from booking"
    )
    
    # Mandatory pax identification fields (denormalized for quick access)
    pax_id_str = models.CharField(
        max_length=50,
        help_text="Passenger ID from BookingPersonDetail"
    )
    pax_first_name = models.CharField(
        max_length=100,
        help_text="Passenger first name"
    )
    pax_last_name = models.CharField(
        max_length=100,
        help_text="Passenger last name"
    )
    booking_id_str = models.CharField(
        max_length=50,
        help_text="Booking ID for quick reference"
    )
    
    # Contact information
    contact_no = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Passenger contact number"
    )
    
    # Transport details
    pickup_location = models.CharField(
        max_length=200,
        help_text="Pickup location (hotel name or address)"
    )
    drop_location = models.CharField(
        max_length=200,
        help_text="Drop location (hotel name or address)"
    )
    
    # Vehicle information
    vehicle = models.ForeignKey(
        VehicleType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_operations',
        help_text="Vehicle assigned for transport"
    )
    vehicle_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Vehicle name (denormalized)"
    )
    
    # Driver information
    driver_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Driver name"
    )
    driver_contact = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Driver contact number"
    )
    
    # Date tracking
    date = models.DateField(
        help_text="Transport operation date for daily tracking"
    )
    pickup_time = models.TimeField(
        blank=True,
        null=True,
        help_text="Scheduled pickup time"
    )
    actual_pickup_time = models.TimeField(
        blank=True,
        null=True,
        help_text="Actual pickup time"
    )
    actual_drop_time = models.TimeField(
        blank=True,
        null=True,
        help_text="Actual drop time"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current transport operation status"
    )
    
    # Audit fields
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes or remarks"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_operations_created'
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_operations_updated'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'operations_transportoperations'
        ordering = ['date', 'pickup_time', 'booking']
        indexes = [
            models.Index(fields=['date', 'status']),
            models.Index(fields=['booking', 'pax']),
            models.Index(fields=['date', 'pickup_location']),
            models.Index(fields=['pax_id_str']),
            models.Index(fields=['booking_id_str']),
        ]
        verbose_name = 'Transport Operation'
        verbose_name_plural = 'Transport Operations'
    
    def __str__(self):
        return f"{self.booking_id_str} - {self.pax_first_name} {self.pax_last_name} - {self.pickup_location} → {self.drop_location} ({self.date})"
    
    def mark_departed(self, user=None):
        """Mark transport as departed"""
        self.status = 'departed'
        if user:
            self.updated_by = user
        self.save()
    
    def mark_arrived(self, user=None):
        """Mark transport as arrived"""
        self.status = 'arrived'
        if user:
            self.updated_by = user
        self.save()
    
    def cancel_operation(self, user=None):
        """Cancel the transport operation"""
        self.status = 'canceled'
        if user:
            self.updated_by = user
        self.save()


class FoodOperation(models.Model):
    """
    Tracks daily food/meal operations for passengers.
    Manages breakfast, lunch, dinner service tracking.
    Supports date-based filtering for daily meal planning.
    """
    
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('served', 'Served'),
        ('canceled', 'Canceled'),
    ]
    
    # Booking and Pax references
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='food_operations',
        help_text="Booking reference"
    )
    pax = models.ForeignKey(
        BookingPersonDetail,
        on_delete=models.CASCADE,
        related_name='food_operations',
        help_text="Passenger/person details from booking"
    )
    
    # Mandatory pax identification fields (denormalized)
    pax_id_str = models.CharField(
        max_length=50,
        help_text="Passenger ID from BookingPersonDetail"
    )
    pax_first_name = models.CharField(
        max_length=100,
        help_text="Passenger first name"
    )
    pax_last_name = models.CharField(
        max_length=100,
        help_text="Passenger last name"
    )
    booking_id_str = models.CharField(
        max_length=50,
        help_text="Booking ID for quick reference"
    )
    
    # Contact information
    contact_no = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Passenger contact number"
    )
    
    # Meal details
    meal_type = models.CharField(
        max_length=20,
        choices=MEAL_TYPE_CHOICES,
        help_text="Type of meal (breakfast/lunch/dinner/snack)"
    )
    
    location = models.CharField(
        max_length=200,
        help_text="Restaurant or hotel name where meal is served"
    )
    
    city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="City where meal is served"
    )
    
    # Date and time
    date = models.DateField(
        help_text="Date of meal service"
    )
    meal_time = models.TimeField(
        blank=True,
        null=True,
        help_text="Scheduled meal time"
    )
    actual_serve_time = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Actual time meal was served"
    )
    
    # Special requirements
    special_requirements = models.TextField(
        blank=True,
        null=True,
        help_text="Dietary restrictions, allergies, special requests"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current meal status"
    )
    
    # Audit fields
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes or remarks"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='food_operations_created'
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='food_operations_updated'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'operations_foodoperations'
        ordering = ['date', 'meal_time', 'booking']
        indexes = [
            models.Index(fields=['date', 'status']),
            models.Index(fields=['booking', 'pax']),
            models.Index(fields=['date', 'meal_type']),
            models.Index(fields=['pax_id_str']),
            models.Index(fields=['booking_id_str']),
        ]
        verbose_name = 'Food Operation'
        verbose_name_plural = 'Food Operations'
    
    def __str__(self):
        return f"{self.booking_id_str} - {self.pax_first_name} {self.pax_last_name} - {self.meal_type} ({self.date})"
    
    def mark_served(self, user=None):
        """Mark meal as served"""
        from django.utils import timezone
        self.status = 'served'
        self.actual_serve_time = timezone.now()
        if user:
            self.updated_by = user
        self.save()
    
    def cancel_operation(self, user=None):
        """Cancel the meal operation"""
        self.status = 'canceled'
        if user:
            self.updated_by = user
        self.save()


# ===============================================
# AIRPORT OPERATION MODEL
# ===============================================

class AirportOperation(models.Model):
    """
    Model for managing airport pickup/drop operations.
    Tracks passenger transfers between airport and hotels.
    """
    
    TRANSFER_TYPE_CHOICES = [
        ('pickup', 'Pickup from Airport'),
        ('drop', 'Drop to Airport'),
    ]
    
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('departed', 'Departed'),
        ('arrived', 'Arrived'),
        ('not_picked', 'Not Picked'),
    ]
    
    # Foreign Keys
    booking = models.ForeignKey(
        'booking.Booking',
        on_delete=models.CASCADE,
        related_name='airport_operations'
    )
    pax = models.ForeignKey(
        'booking.BookingPersonDetail',
        on_delete=models.CASCADE,
        related_name='airport_operations'
    )
    
    # Denormalized fields (auto-populated from related objects)
    booking_id_str = models.CharField(max_length=50, db_index=True)  # BKG-101
    pax_id_str = models.CharField(max_length=50, db_index=True)      # PAX001
    pax_first_name = models.CharField(max_length=100)
    pax_last_name = models.CharField(max_length=100)
    contact_no = models.CharField(max_length=20, blank=True, null=True)
    
    # Transfer Details
    transfer_type = models.CharField(
        max_length=10,
        choices=TRANSFER_TYPE_CHOICES,
        db_index=True
    )
    flight_number = models.CharField(max_length=20, db_index=True)
    flight_time = models.TimeField()
    date = models.DateField(db_index=True)
    pickup_point = models.CharField(max_length=200)  # "Jeddah Airport"
    drop_point = models.CharField(max_length=200)    # "Makkah Hotel"
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='waiting',
        db_index=True
    )
    
    # Timestamps
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    actual_arrival_time = models.DateTimeField(null=True, blank=True)
    
    # Additional Info
    notes = models.TextField(blank=True, null=True)
    
    # Audit fields
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_airport_operations'
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_airport_operations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'operations_airportoperations'
        ordering = ['date', 'flight_time', 'booking']
        indexes = [
            models.Index(fields=['date', 'transfer_type']),
            models.Index(fields=['booking_id_str', 'status']),
            models.Index(fields=['flight_number', 'date']),
        ]
    
    def __str__(self):
        return f"{self.booking_id_str} - {self.transfer_type} - {self.flight_number}"
    
    def mark_departed(self, user=None):
        """
        Mark the transfer as departed.
        Sets status to 'departed' and records actual pickup time.
        """
        from django.utils import timezone
        self.status = 'departed'
        self.actual_pickup_time = timezone.now()
        if user:
            self.updated_by = user
        self.save()
    
    def mark_arrived(self, user=None):
        """
        Mark the transfer as arrived.
        Sets status to 'arrived' and records actual arrival time.
        """
        from django.utils import timezone
        self.status = 'arrived'
        self.actual_arrival_time = timezone.now()
        if user:
            self.updated_by = user
        self.save()
    
    def mark_not_picked(self, user=None):
        """
        Mark passenger as not picked up.
        Sets status to 'not_picked'.
        """
        self.status = 'not_picked'
        if user:
            self.updated_by = user
        self.save()


class ZiyaratOperation(models.Model):
    """
    Model for tracking Ziyarat (religious site visits) operations.
    Denormalized structure for daily operations efficiency.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('started', 'Started'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
        ('not_picked', 'Not Picked'),
    ]
    
    # Foreign Keys
    booking = models.ForeignKey('booking.Booking', on_delete=models.CASCADE, related_name='ziyarat_operations')
    pax = models.ForeignKey('booking.BookingPersonDetail', on_delete=models.CASCADE, related_name='ziyarat_operations')
    
    # Denormalized Fields (for quick access without joins)
    booking_id_str = models.CharField(max_length=50, db_index=True, help_text="Denormalized booking number")
    pax_id_str = models.CharField(max_length=20, db_index=True, help_text="Denormalized pax ID")
    pax_first_name = models.CharField(max_length=100, blank=True)
    pax_last_name = models.CharField(max_length=100, blank=True)
    pax_full_name = models.CharField(max_length=200, blank=True)
    contact_no = models.CharField(max_length=20, blank=True, null=True)
    
    # Ziyarat Details
    location = models.CharField(max_length=200, help_text="Ziyarat location (e.g., Uhud Mountain, Quba Mosque)")
    date = models.DateField(db_index=True, help_text="Date of ziyarat")
    pickup_time = models.TimeField(help_text="Scheduled pickup time")
    guide_name = models.CharField(max_length=100, blank=True, null=True, help_text="Tour guide name")
    
    # Status & Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    actual_start_time = models.DateTimeField(null=True, blank=True, help_text="Actual start time")
    actual_completion_time = models.DateTimeField(null=True, blank=True, help_text="Actual completion time")
    
    # Notes
    notes = models.TextField(blank=True, null=True, help_text="Additional notes for this ziyarat")
    
    # Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ziyarat_operations_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ziyarat_operations_updated')
    
    class Meta:
        ordering = ['date', 'pickup_time', 'location']
        indexes = [
            models.Index(fields=['date', 'status']),
            models.Index(fields=['booking_id_str', 'date']),
            models.Index(fields=['location', 'date']),
        ]
        verbose_name = 'Ziyarat Operation'
        verbose_name_plural = 'Ziyarat Operations'
    
    def __str__(self):
        return f"{self.booking_id_str} - {self.location} - {self.date} ({self.status})"
    
    def save(self, *args, **kwargs):
        """Auto-populate denormalized fields"""
        if self.booking:
            self.booking_id_str = self.booking.booking_number
        
        if self.pax:
            self.pax_id_str = str(self.pax.id)
            self.pax_first_name = self.pax.first_name or ''
            self.pax_last_name = self.pax.last_name or ''
            self.pax_full_name = f"{self.pax_first_name} {self.pax_last_name}".strip()
            self.contact_no = self.pax.contact_number
        
        super().save(*args, **kwargs)
    
    def mark_started(self, user=None):
        """
        Mark ziyarat as started.
        Sets status to 'started' and records actual_start_time.
        """
        self.status = 'started'
        self.actual_start_time = timezone.now()
        if user:
            self.updated_by = user
        self.save()
    
    def mark_completed(self, user=None):
        """
        Mark ziyarat as completed.
        Sets status to 'completed' and records actual_completion_time.
        """
        self.status = 'completed'
        self.actual_completion_time = timezone.now()
        if user:
            self.updated_by = user
        self.save()
    
    def mark_not_picked(self, user=None):
        """
        Mark passenger as not picked up for ziyarat.
        Sets status to 'not_picked'.
        """
        self.status = 'not_picked'
        if user:
            self.updated_by = user
        self.save()

