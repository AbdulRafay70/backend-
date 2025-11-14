from django.db import models
from django.conf import settings
from booking.models import Booking, BookingPersonDetail
from packages.models import City
from tickets.models import Hotels


class PaxMovement(models.Model):
    """Track passenger movement from Pakistan to KSA and back"""
    
    STATUS_CHOICES = [
        ('in_pakistan', 'In Pakistan'),
        ('entered_ksa', 'Entered KSA'),
        ('in_ksa', 'In KSA'),
        ('exited_ksa', 'Exited KSA'),
    ]
    
    VERIFICATION_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('not_verified', 'Not Verified'),
    ]
    
    # Auto-generated unique PAX ID
    pax_id = models.CharField(max_length=20, unique=True, editable=False)
    
    # Link to booking and person
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='pax_movements')
    person = models.ForeignKey(BookingPersonDetail, on_delete=models.CASCADE, related_name='movements')
    
    # Movement status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_pakistan')
    current_city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, related_name='current_pax')
    
    # Entry/Exit tracking
    entry_date = models.DateTimeField(null=True, blank=True)
    exit_date = models.DateTimeField(null=True, blank=True)
    exit_verification = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='pending')
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_exits')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Flight information
    flight_number_to_ksa = models.CharField(max_length=20, blank=True, null=True)
    flight_date_to_ksa = models.DateTimeField(null=True, blank=True)
    flight_number_from_ksa = models.CharField(max_length=20, blank=True, null=True)
    flight_date_from_ksa = models.DateTimeField(null=True, blank=True)
    
    # Departure and arrival details
    departure_airport = models.CharField(max_length=100, blank=True, null=True, help_text="Departure airport name/code")
    arrival_airport = models.CharField(max_length=100, blank=True, null=True, help_text="Arrival airport name/code")
    
    # Passport information
    passport_number = models.CharField(max_length=50, blank=True, null=True)
    passport_expiry = models.DateField(null=True, blank=True)
    
    # Organization and agent tracking
    organization = models.ForeignKey('organization.Organization', on_delete=models.SET_NULL, null=True, blank=True, related_name='pax_movements')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_pax_movements')
    
    # Shirka reporting
    reported_to_shirka = models.BooleanField(default=False, help_text="Whether this movement has been reported to Shirka")
    shirka_report_date = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_movements')
    
    # Notification tracking
    agent_notified = models.BooleanField(default=False)
    last_notification_sent = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['pax_id']),
            models.Index(fields=['booking']),
            models.Index(fields=['status']),
            models.Index(fields=['current_city']),
        ]
    
    def __str__(self):
        return f"{self.pax_id} - {self.person.first_name} {self.person.last_name} - {self.status}"
    
    def save(self, *args, **kwargs):
        if not self.pax_id:
            # Generate PAX ID: PAX + booking_id + person_id
            self.pax_id = f"PAX{self.booking.id:04d}{self.person.id:03d}"
        
        # Auto-reset reported_to_shirka if flight details change
        if self.pk:  # Only for updates, not new records
            try:
                old_instance = PaxMovement.objects.get(pk=self.pk)
                flight_fields_changed = (
                    old_instance.flight_number_to_ksa != self.flight_number_to_ksa or
                    old_instance.flight_date_to_ksa != self.flight_date_to_ksa or
                    old_instance.flight_number_from_ksa != self.flight_number_from_ksa or
                    old_instance.flight_date_from_ksa != self.flight_date_from_ksa
                )
                if flight_fields_changed and self.reported_to_shirka:
                    self.reported_to_shirka = False
                    self.shirka_report_date = None
            except PaxMovement.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)


class AirportTransfer(models.Model):
    """Manage airport pickup/drop transfers"""
    
    TRANSFER_TYPE_CHOICES = [
        ('pickup', 'Pickup'),
        ('drop', 'Drop'),
    ]
    
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('departed', 'Departed'),
        ('arrived', 'Arrived'),
        ('not_picked', 'Not Picked'),
        ('cancelled', 'Cancelled'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='airport_transfers')
    transfer_type = models.CharField(max_length=10, choices=TRANSFER_TYPE_CHOICES)
    
    # Flight details
    flight_number = models.CharField(max_length=20)
    flight_date = models.DateField()
    flight_time = models.TimeField()
    
    # Location details
    pickup_point = models.CharField(max_length=255)
    drop_point = models.CharField(max_length=255)
    
    # Vehicle details
    vehicle_type = models.CharField(max_length=100, blank=True, null=True)
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    driver_name = models.CharField(max_length=100, blank=True, null=True)
    driver_contact = models.CharField(max_length=20, blank=True, null=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    
    # Timestamps
    scheduled_time = models.DateTimeField()
    actual_departure_time = models.DateTimeField(null=True, blank=True)
    actual_arrival_time = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['flight_date', 'flight_time']
        indexes = [
            models.Index(fields=['flight_date']),
            models.Index(fields=['booking']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.booking.booking_number} - {self.transfer_type} - {self.flight_number}"


class AirportTransferPax(models.Model):
    """Track individual passengers in airport transfers"""
    
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('departed', 'Departed'),
        ('arrived', 'Arrived'),
        ('not_picked', 'Not Picked'),
    ]
    
    transfer = models.ForeignKey(AirportTransfer, on_delete=models.CASCADE, related_name='passengers')
    pax_movement = models.ForeignKey(PaxMovement, on_delete=models.CASCADE, related_name='airport_transfers')
    person = models.ForeignKey(BookingPersonDetail, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['transfer', 'person']
    
    def __str__(self):
        return f"{self.person.first_name} {self.person.last_name} - {self.transfer}"


class Transport(models.Model):
    """City-to-city or hotel-to-hotel transport"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('departed', 'Departed'),
        ('arrived', 'Arrived'),
        ('cancelled', 'Cancelled'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='transports')
    
    # Route details
    pickup_location = models.CharField(max_length=255)
    pickup_city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, related_name='pickup_transports')
    drop_location = models.CharField(max_length=255)
    drop_city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, related_name='drop_transports')
    
    # Schedule
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    
    # Vehicle details
    vehicle_type = models.CharField(max_length=100)
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    driver_name = models.CharField(max_length=100, blank=True, null=True)
    driver_contact = models.CharField(max_length=20, blank=True, null=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    actual_departure_time = models.DateTimeField(null=True, blank=True)
    actual_arrival_time = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['scheduled_date', 'scheduled_time']
        indexes = [
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['booking']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.booking.booking_number} - {self.pickup_location} to {self.drop_location}"


class TransportPax(models.Model):
    """Track individual passengers in transport"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('departed', 'Departed'),
        ('arrived', 'Arrived'),
        ('not_picked', 'Not Picked'),
    ]
    
    transport = models.ForeignKey(Transport, on_delete=models.CASCADE, related_name='passengers')
    pax_movement = models.ForeignKey(PaxMovement, on_delete=models.CASCADE, related_name='transports')
    person = models.ForeignKey(BookingPersonDetail, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['transport', 'person']
    
    def __str__(self):
        return f"{self.person.first_name} {self.person.last_name} - {self.transport}"


class Ziyarat(models.Model):
    """Manage ziyarat schedules"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('started', 'Started'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='ziyarats')
    
    # Location details
    location = models.CharField(max_length=255)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True)
    
    # Schedule
    scheduled_date = models.DateField()
    pickup_time = models.TimeField()
    expected_return_time = models.TimeField(null=True, blank=True)
    
    # Vehicle details
    vehicle_type = models.CharField(max_length=100, blank=True, null=True)
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    guide_name = models.CharField(max_length=100, blank=True, null=True)
    guide_contact = models.CharField(max_length=20, blank=True, null=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['scheduled_date', 'pickup_time']
        indexes = [
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['booking']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.booking.booking_number} - {self.location} - {self.scheduled_date}"


class ZiyaratPax(models.Model):
    """Track individual passengers in ziyarat"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('started', 'Started'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('not_picked', 'Not Picked'),
    ]
    
    ziyarat = models.ForeignKey(Ziyarat, on_delete=models.CASCADE, related_name='passengers')
    pax_movement = models.ForeignKey(PaxMovement, on_delete=models.CASCADE, related_name='ziyarats')
    person = models.ForeignKey(BookingPersonDetail, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['ziyarat', 'person']
    
    def __str__(self):
        return f"{self.person.first_name} {self.person.last_name} - {self.ziyarat}"


class FoodService(models.Model):
    """Manage daily meal services"""
    
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='food_services')
    
    # Meal details
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    menu = models.TextField()
    
    # Schedule
    service_date = models.DateField()
    service_time = models.TimeField()
    
    # Location
    location = models.CharField(max_length=255)
    hotel = models.ForeignKey(Hotels, on_delete=models.SET_NULL, null=True, blank=True)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    actual_service_time = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['service_date', 'service_time']
        indexes = [
            models.Index(fields=['service_date']),
            models.Index(fields=['booking']),
            models.Index(fields=['status']),
            models.Index(fields=['meal_type']),
        ]
    
    def __str__(self):
        return f"{self.booking.booking_number} - {self.meal_type} - {self.service_date}"


class FoodServicePax(models.Model):
    """Track individual passengers in food service"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    ]
    
    food_service = models.ForeignKey(FoodService, on_delete=models.CASCADE, related_name='passengers')
    pax_movement = models.ForeignKey(PaxMovement, on_delete=models.CASCADE, related_name='food_services')
    person = models.ForeignKey(BookingPersonDetail, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['food_service', 'person']
    
    def __str__(self):
        return f"{self.person.first_name} {self.person.last_name} - {self.food_service}"
