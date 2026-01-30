from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class FlightBooking(models.Model):
    """Model to store flight booking/ticket information"""
    
    # Booking References
    pnr = models.CharField(max_length=20, unique=True, db_index=True)
    booking_ref_id = models.CharField(max_length=100, unique=True, db_index=True)
    status = models.CharField(max_length=10, default='HK')  # HK=Confirmed, UC=Pending, XX=Cancelled
    airline_locator = models.CharField(max_length=50, blank=True, null=True)
    airline_code = models.CharField(max_length=10, blank=True, null=True)
    
    # Passenger Information
    passenger_name = models.CharField(max_length=200)
    passenger_email = models.EmailField()
    passenger_phone = models.CharField(max_length=50)
    nationality = models.CharField(max_length=10, blank=True, null=True)
    passport_number = models.CharField(max_length=50, blank=True, null=True)
    # Agent-submitted override for passport/document number.
    # Use this to preserve the literal value the agent entered even if
    # AIQS/supplier returns a masked/normalized value.
    passport_override = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.CharField(max_length=20, blank=True, null=True)
    
    # Flight Route
    origin = models.CharField(max_length=10)
    destination = models.CharField(max_length=10)
    origin_city = models.CharField(max_length=100, blank=True, null=True)
    destination_city = models.CharField(max_length=100, blank=True, null=True)
    
    # Flight Details
    departure_date = models.CharField(max_length=50, blank=True, null=True)
    arrival_date = models.CharField(max_length=50, blank=True, null=True)
    flight_number = models.CharField(max_length=20, blank=True, null=True)
    cabin_class = models.CharField(max_length=50, default='Economy')
    
    # Fare Information
    base_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='PKR')
    
    # Segments (stored as JSON)
    segments = models.JSONField(blank=True, null=True)
    
    # Supplier Information
    supplier_code = models.IntegerField(blank=True, null=True)
    
    # Timestamps
    booking_date = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # User relationship
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flight_bookings', null=True, blank=True)
    
    class Meta:
        db_table = 'flight_bookings'
        ordering = ['-booking_date']
        indexes = [
            models.Index(fields=['pnr']),
            models.Index(fields=['booking_ref_id']),
            models.Index(fields=['user', '-booking_date']),
        ]
    
    def __str__(self):
        return f"{self.pnr} - {self.passenger_name}"
