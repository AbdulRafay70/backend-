from django.db import models
from django.core import validators
from organization.models import Organization
from packages.models import Airlines, City
from django.contrib.auth.models import User

# Create your models here.


class Ticket(models.Model):
    """
    Model to store the details of a Ticket (Flight Inventory).
    """
    
    SEAT_TYPE_CHOICES = [
        ('economy', 'Economy'),
        ('premium_economy', 'Premium Economy'),
        ('business', 'Business'),
        ('first_class', 'First Class'),
    ]
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('sold_out', 'Sold Out'),
        ('on_hold', 'On Hold'),
        ('cancelled', 'Cancelled'),
    ]
    
    REFUND_RULE_CHOICES = [
        ('non_refundable', 'Non-Refundable'),
        ('refundable', 'Refundable'),
        ('partially_refundable', 'Partially Refundable'),
    ]

    # Organization and Branch
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="tickets"
    )
    branch = models.ForeignKey(
        'organization.Branch', on_delete=models.CASCADE, related_name="tickets", blank=True, null=True
    )
    
    # Flight Information
    airline = models.ForeignKey(
        Airlines, on_delete=models.CASCADE, related_name="tickets"
    )
    flight_number = models.CharField(max_length=20, help_text="Flight number (e.g., EK-502)", blank=True, null=True)
    
    # Route Information
    origin = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="origin_tickets", help_text="Departure city", blank=True, null=True
    )
    destination = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="destination_tickets", help_text="Arrival city", blank=True, null=True
    )
    
    # Date and Time
    departure_date = models.DateField(help_text="Departure date", blank=True, null=True)
    departure_time = models.TimeField(help_text="Departure time", blank=True, null=True)
    arrival_date = models.DateField(help_text="Arrival date", blank=True, null=True)
    arrival_time = models.TimeField(help_text="Arrival time", blank=True, null=True)
    
    # Seat and Pricing
    seat_type = models.CharField(max_length=50, choices=SEAT_TYPE_CHOICES, default='economy')
    adult_fare = models.FloatField(default=0, help_text="Adult fare price")
    child_fare = models.FloatField(default=0, help_text="Child fare price")
    infant_fare = models.FloatField(default=0, help_text="Infant fare price")
    
    # Baggage
    baggage_weight = models.FloatField(default=0, help_text="Baggage allowance in KG")
    baggage_pieces = models.IntegerField(default=0, help_text="Number of baggage pieces allowed")
    
    # Refund Rules
    refund_rule = models.CharField(max_length=50, choices=REFUND_RULE_CHOICES, default='non_refundable')
    is_refundable = models.BooleanField(default=False)
    
    # Additional Services
    is_meal_included = models.BooleanField(default=False)
    
    # PNR and Status
    pnr = models.CharField(max_length=100, help_text="Passenger Name Record", blank=True, default="N/A")
    ticket_number = models.CharField(max_length=20, unique=True, blank=True, null=True, help_text="Unique ticket number")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='available')
    
    # Seat Inventory
    total_seats = models.IntegerField(default=0, help_text="Total seats available")
    left_seats = models.IntegerField(default=0, help_text="Remaining seats")
    booked_tickets = models.IntegerField(default=0, help_text="Total booked seats")
    confirmed_tickets = models.IntegerField(default=0, help_text="Total confirmed seats")
    
    # Legacy fields for compatibility
    child_price = models.FloatField(default=0)  # Alias for child_fare
    infant_price = models.FloatField(default=0)  # Alias for infant_fare
    adult_price = models.FloatField(default=0)  # Alias for adult_fare
    weight = models.FloatField(default=0)  # Alias for baggage_weight
    pieces = models.IntegerField(default=0)  # Alias for baggage_pieces
    # Purchase price fields (cost to the seller / procurement cost)
    adult_purchase_price = models.FloatField(default=0, help_text="Purchase price for adult ticket")
    child_purchase_price = models.FloatField(default=0, help_text="Purchase price for child ticket")
    infant_purchase_price = models.FloatField(default=0, help_text="Purchase price for infant ticket")
    
    # Trip Type and Stay
    is_umrah_seat = models.BooleanField(default=False)
    trip_type = models.CharField(max_length=50)
    departure_stay_type = models.CharField(max_length=50)
    return_stay_type = models.CharField(max_length=50)
    
    # Ownership and Reselling
    owner_organization_id = models.IntegerField(blank=True, null=True, help_text="Organization that owns this inventory")
    inventory_owner_organization_id = models.IntegerField(blank=True, null=True)
    reselling_allowed = models.BooleanField(default=False, help_text="Allow reselling by other agencies")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.airline.name if self.airline else 'N/A'} {self.flight_number} - {self.origin.name if self.origin else 'N/A'} to {self.destination.name if self.destination else 'N/A'}"
    
    def save(self, *args, **kwargs):
        # Sync legacy fields with new fields (bidirectional)
        if hasattr(self, 'adult_fare') and self.adult_fare is not None:
            self.adult_price = self.adult_fare
        if hasattr(self, 'child_fare') and self.child_fare is not None:
            self.child_price = self.child_fare
        if hasattr(self, 'infant_fare') and self.infant_fare is not None:
            self.infant_price = self.infant_fare
        if hasattr(self, 'baggage_weight') and self.baggage_weight is not None:
            self.weight = self.baggage_weight
        if hasattr(self, 'baggage_pieces') and self.baggage_pieces is not None:
            self.pieces = self.baggage_pieces
            
        # Also sync the other way for legacy compatibility
        if hasattr(self, 'adult_price') and self.adult_price is not None:
            self.adult_fare = self.adult_price
        if hasattr(self, 'child_price') and self.child_price is not None:
            self.child_fare = self.child_price
        if hasattr(self, 'infant_price') and self.infant_price is not None:
            self.infant_fare = self.infant_price
        if hasattr(self, 'weight') and self.weight is not None:
            self.baggage_weight = self.weight
        if hasattr(self, 'pieces') and self.pieces is not None:
            self.baggage_pieces = self.pieces
        
        # Generate ticket number if not set
        if not self.ticket_number:
            import uuid
            # Generate a unique ticket number like TKT-XXXXXX
            self.ticket_number = f"TKT-{str(uuid.uuid4())[:8].upper()}"
        
        # Avoid generating random flight numbers.
        # When a flight number is not provided, prefer an explicit "N/A" value
        # rather than inventing a random code which can be confusing.
        if not self.flight_number:
            # Keep as blank/NULL or use a canonical placeholder. We use "N/A" for clarity.
            self.flight_number = "N/A"
        
        super().save(*args, **kwargs)
    
    @property
    def is_available(self):
        """Check if ticket has available seats"""
        return self.left_seats > 0 and self.status == 'available'
    
    @property
    def occupancy_rate(self):
        """Calculate occupancy percentage"""
        if self.total_seats > 0:
            return (self.booked_tickets / self.total_seats) * 100
        return 0
    
    class Meta:
        verbose_name = "Flight Ticket"
        verbose_name_plural = "Flight Tickets"
        ordering = ['-departure_date', 'departure_time']



class TicketTripDetails(models.Model):
    """
    Model to store the trip details of a Ticket.
    """

    ticket = models.ForeignKey(
        Ticket, on_delete=models.CASCADE, related_name="trip_details"
    )
    # Per-leg flight number (allow storing different numbers for outbound/return)
    flight_number = models.CharField(max_length=20, blank=True, null=True)
    departure_date_time = models.DateTimeField()
    arrival_date_time = models.DateTimeField()
    departure_city = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="departure_tickets"
    )
    arrival_city = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="arrival_tickets"
    )
    trip_type = models.CharField(max_length=50)


class TickerStopoverDetails(models.Model):
    """
    Model to store the stopover details of a Ticket.
    """

    ticket = models.ForeignKey(
        Ticket, on_delete=models.CASCADE, related_name="stopover_details"
    )
    stopover_city = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="stopover_tickets"
    )
    stopover_duration = models.CharField(max_length=100)
    trip_type = models.CharField(max_length=50)


class Hotels(models.Model):
    """
    Model to store the details of a Hotel.
    """
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending'),
        ('maintenance', 'Maintenance'),
    ]
    
    CATEGORY_CHOICES = [
        ('economy', 'Economy'),
        ('budget', 'Budget'),
        ('standard', 'Standard'),
        ('deluxe', 'Deluxe'),
        ('luxury', 'Luxury'),
        ('5_star', '5 Star'),
        ('4_star', '4 Star'),
        ('3_star', '3 Star'),
        ('2_star', '2 Star'),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="hotels", null=True, blank=True
    )
    # Owner organization id (separate from the `organization` FK). This
    # allows recording the owning organization id for inventory ownership
    # semantics without introducing an additional FK relationship.
    owner_organization_id = models.IntegerField(blank=True, null=True, help_text="Organization that owns this inventory")
    name = models.CharField(max_length=255)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, related_name="hotels")
    address = models.TextField()
    google_location = models.CharField(max_length=255, blank=True, null=True)
    # Video upload field for hotel promotional videos
    video = models.FileField(upload_to='hotel_videos/', blank=True, null=True, help_text="Upload hotel video")
    reselling_allowed = models.BooleanField(default=False)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='standard')
    distance = models.FloatField(default=0)
    # Walking distance in meters from reference point
    walking_distance = models.FloatField(default=0, help_text='Walking distance in meters from reference point')
    # Walking time in minutes (user-entered, not auto-calculated)
    walking_time = models.FloatField(default=0, help_text='Walking time in minutes (user-entered)')
    is_active = models.BooleanField(default=True)
    available_start_date = models.DateField(blank=True, null=True)
    available_end_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    
    def __str__(self):
        """String representation showing hotel name and city"""
        return f"{self.name} - {self.city.name if self.city else 'Unknown City'}"
    
    class Meta:
        verbose_name = "Hotel"
        verbose_name_plural = "Hotels"
        ordering = ['name']


class HotelCategory(models.Model):
    """
    Dynamic hotel categories so admins can add/edit/delete categories
    without needing to change model choice constants.
    """
    name = models.CharField(max_length=100, unique=True)


class HotelFloor(models.Model):
    """
    Model to store hotel floor information.
    Allows creating floors before adding rooms.
    """
    FLOOR_CHOICES = [
        ('ground', 'Ground Floor'),
        ('0', 'Ground Floor'),
        ('1', '1st Floor'),
        ('2', '2nd Floor'),
        ('3', '3rd Floor'),
        ('4', '4th Floor'),
        ('5', '5th Floor'),
        ('6', '6th Floor'),
        ('7', '7th Floor'),
        ('8', '8th Floor'),
        ('9', '9th Floor'),
        ('10', '10th Floor'),
        ('basement', 'Basement'),
    ]
    
    hotel = models.ForeignKey(Hotels, on_delete=models.CASCADE, related_name="floors")
    floor_no = models.CharField(max_length=50, choices=FLOOR_CHOICES)
    floor_title = models.CharField(max_length=100, blank=True, null=True)
    map_image = models.ImageField(upload_to='floor_maps/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Hotel Floor"
        verbose_name_plural = "Hotel Floors"
        unique_together = ['hotel', 'floor_no']
        ordering = ['hotel', 'floor_no']
    
    def __str__(self):
        return f"{self.hotel.name} - {self.floor_title or f'Floor {self.floor_no}'}"


class HotelCategory(models.Model):
    """
    Dynamic hotel categories so admins can add/edit/delete categories
    without needing to change model choice constants.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="hotel_categories", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Hotel Category"
        verbose_name_plural = "Hotel Categories"
        ordering = ["name"]


class BedType(models.Model):
    """
    Dynamic bed types so admins can add/edit/delete bed types
    without needing to change model choice constants.
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, blank=True)
    capacity = models.IntegerField(
        default=1, 
        help_text="Default capacity for this bed type (max 10)",
        validators=[
            validators.MinValueValidator(1, message="Capacity must be at least 1"),
            validators.MaxValueValidator(10, message="Capacity cannot exceed 10 beds")
        ]
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="bed_types", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        """Validate bed type before saving"""
        from django.core.exceptions import ValidationError
        
        # Validate capacity
        if self.capacity and self.capacity > 10:
            raise ValidationError({'capacity': 'Maximum capacity is 10 beds'})
        if self.capacity and self.capacity < 1:
            raise ValidationError({'capacity': 'Capacity must be at least 1'})

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Bed Type"
        verbose_name_plural = "Bed Types"
        ordering = ["name"]
        unique_together = [['slug', 'organization']]



class HotelPrices(models.Model):
    """
    Model to store the prices of a Hotel.
    """
    
    ROOM_TYPE_CHOICES = [
        ('single', 'Single'),
        ('sharing', 'Sharing'),
        ('room', 'Room'),
        ('double', 'Double'),
        ('triple', 'Triple'),
        ('quad', 'Quad'),
        ('quint', 'Quint'),
        ('6-bed', '6 Bed'),
        ('7-bed', '7 Bed'),
        ('8-bed', '8 Bed'),
        ('9-bed', '9 Bed'),
        ('10-bed', '10 Bed'),
        ('suite', 'Suite'),
        ('deluxe', 'Deluxe'),
        ('executive', 'Executive'),
    ]

    hotel = models.ForeignKey(Hotels, on_delete=models.CASCADE, related_name="prices")
    start_date = models.DateField()
    end_date = models.DateField()
    room_type = models.CharField(max_length=50, choices=ROOM_TYPE_CHOICES)
    price= models.FloatField(default=0)
    # Purchase price (cost to the seller) — reintroduced for frontend compatibility
    purchase_price = models.FloatField(blank=True, default=0, null=True)
    is_sharing_allowed = models.BooleanField(default=False)
    # room_price = models.FloatField(default=0)
    # quint_price = models.FloatField(default=0)
    # quad_price = models.FloatField(default=0)
    # triple_price = models.FloatField(default=0)
    # double_price = models.FloatField(default=0)
    
    def __str__(self):
        return f"{self.hotel.name} - {self.room_type} (${self.price})"
    
    class Meta:
        verbose_name = "Hotel Price"
        verbose_name_plural = "Hotel Prices"


class HotelContactDetails(models.Model):
    """
    Model to store the contact details of a Hotel.
    """

    hotel = models.ForeignKey(
        Hotels, on_delete=models.CASCADE, related_name="contact_details"
    )
    contact_person = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=20)
    
    def __str__(self):
        return f"{self.hotel.name} - {self.contact_person}"
    
    class Meta:
        verbose_name = "Hotel Contact Detail"
        verbose_name_plural = "Hotel Contact Details"


class HotelRooms(models.Model):
    """
    Model to store the details of a Hotel Room.
    """
    FLOOR_CHOICES = [
        ('ground', 'Ground Floor'),
        ('1', '1st Floor'),
        ('2', '2nd Floor'),
        ('3', '3rd Floor'),
        ('4', '4th Floor'),
        ('5', '5th Floor'),
        ('6', '6th Floor'),
        ('7', '7th Floor'),
        ('8', '8th Floor'),
        ('9', '9th Floor'),
        ('10', '10th Floor'),
        ('basement', 'Basement'),
    ]
    
    ROOM_TYPE_CHOICES = [
        ('single', 'Single'),
        ('double', 'Double'),
        ('triple', 'Triple'),
        ('quad', 'Quad'),
        ('quint', 'Quint'),
        ('sharing', 'Sharing'),
        ('suite', 'Suite'),
        ('deluxe', 'Deluxe'),
        ('executive', 'Executive'),
    ]
    
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('NEED CLEANING', 'Need Cleaning'),
        ('UNDER MAINTENANCE', 'Under Maintenance'),
    ]

    hotel = models.ForeignKey(Hotels, on_delete=models.PROTECT, related_name="rooms")
    floor = models.CharField(max_length=50, choices=FLOOR_CHOICES)
    room_type = models.CharField(max_length=50, choices=ROOM_TYPE_CHOICES)
    room_number = models.CharField(max_length=20)
    total_beds = models.IntegerField(default=1)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='AVAILABLE')
    
    def __str__(self):
        return f"{self.hotel.name} - Room {self.room_number} (Floor {self.floor})"
    
    class Meta:
        verbose_name = "Hotel Room"
        verbose_name_plural = "Hotel Rooms"

class RoomDetails(models.Model):
    """
    Model to store the details of a Hotel Room.
    """
    
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
    ]

    room = models.ForeignKey(HotelRooms, on_delete=models.CASCADE, related_name="details")
    bed_number = models.CharField(max_length=20)
    is_assigned = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    def __str__(self):
        return f"Bed {self.bed_number} - Room {self.room.room_number} ({self.status})"
    
    class Meta:
        verbose_name = "Room Detail"
        verbose_name_plural = "Room Details"


class HotelPhoto(models.Model):
    hotel = models.ForeignKey(Hotels, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="media/hotel_photos/", null=True, blank=True)
    caption = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.hotel.name} - Photo {self.id}"
    
    class Meta:
        verbose_name = "Hotel Photo"
        verbose_name_plural = "Hotel Photos"