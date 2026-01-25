from django.db import models
from organization.models import Organization,Agency
from django.contrib.auth.models import User
import secrets
from datetime import datetime

# Create your models here.


class Visa(models.Model):
    """
    Standalone Visa model for managing visa records independently or linked to packages.
    Can be used for Umrah visas, tourist visas, work visas, etc.
    """
    
    VISA_TYPE_CHOICES = (
        ('umrah', 'Umrah'),
        ('tourist', 'Tourist'),
        ('work', 'Work'),
        ('business', 'Business'),
        ('transit', 'Transit'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('issued', 'Issued'),
        ('cancelled', 'Cancelled'),
        ('used', 'Used'),
        ('expired', 'Expired'),
    )
    
    COUNTRY_CHOICES = (
        ('SAU', 'Saudi Arabia (KSA)'),
        ('UAE', 'United Arab Emirates'),
        ('QAT', 'Qatar'),
        ('OMN', 'Oman'),
        ('KWT', 'Kuwait'),
        ('BHR', 'Bahrain'),
    )
    
    # Auto-generated unique visa ID
    visa_id = models.CharField(max_length=50, unique=True, editable=False, blank=True)
    
    # Basic details
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='visas'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_visas',
        db_constraint=False  # Disable FK constraint for MySQL compatibility
    )
    
    # Visa details
    visa_type = models.CharField(max_length=20, choices=VISA_TYPE_CHOICES, default='umrah')
    country = models.CharField(max_length=3, choices=COUNTRY_CHOICES, default='SAU')
    
    # Dates
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    application_date = models.DateField(auto_now_add=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    adult_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    child_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    infant_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Service provider details
    service_provider = models.CharField(max_length=255, blank=True, null=True)
    service_provider_contact = models.CharField(max_length=50, blank=True, null=True)
    
    # Additional info
    notes = models.TextField(blank=True, null=True)
    validity_days = models.IntegerField(default=30, help_text="Visa validity in days")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Visa"
        verbose_name_plural = "Visas"
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Auto-generate visa_id if not exists
        if not self.visa_id:
            date_str = datetime.now().strftime('%Y%m%d')
            random_str = secrets.token_hex(3).upper()
            self.visa_id = f"VISA-{date_str}-{random_str}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.visa_id} - {self.get_visa_type_display()} ({self.get_status_display()})"


class RiyalRate(models.Model):
    """
    Model to store the exchange rate of Riyal.
    """

    organization = models.OneToOneField(Organization, on_delete=models.CASCADE)
    rate = models.FloatField(default=0)
    is_visa_pkr = models.BooleanField(default=False)
    is_hotel_pkr = models.BooleanField(default=False)
    is_transport_pkr = models.BooleanField(default=False)
    is_ziarat_pkr = models.BooleanField(default=False)
    is_food_pkr = models.BooleanField(default=False)


class Shirka(models.Model):
    """
    Model to store the details of
    a Shirka.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="shirkas"
    )
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class SetVisaType(models.Model):
    """
    Model to store the type of visa.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="visa_types"
    )
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class UmrahVisaPrice(models.Model):
    """
    Model to store the price of Umrah visa.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="umrah_visa_prices"
    )
    visa_type = models.CharField(max_length=50)
    category = models.CharField(max_length=50)
    adault_price = models.FloatField(default=0)
    child_price = models.FloatField(default=0)
    infant_price = models.FloatField(default=0)
    maximum_nights = models.IntegerField(default=0)


class UmrahVisaPriceTwo(models.Model):
    """
    Model to store the price of Umrah visa for two categories.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="umrah_visa_prices_two"
    )
    title = models.CharField(max_length=100)
    person_from = models.IntegerField(default=0)  # in months
    person_to = models.IntegerField(default=0)  # in months
     # Replace legacy single-price fields with explicit selling/purchase fields
    adult_selling_price = models.FloatField(default=0)
    adult_purchase_price = models.FloatField(default=0)
    child_selling_price = models.FloatField(default=0)
    child_purchase_price = models.FloatField(default=0)
    infant_selling_price = models.FloatField(default=0)
    infant_purchase_price = models.FloatField(default=0)
    is_transport = models.BooleanField(default=False)
    
    vehicle_types = models.ManyToManyField(
        "booking.VehicleType",
        related_name="umrah_visa_prices_two",
        blank=True
    )
    def __str__(self):
        return f"{self.title} ({self.organization.name})"


class OnlyVisaPrice(models.Model):
    """
    Model to store the price of only visa.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="only_visa_prices"
    )
    adault_price = models.FloatField(default=0)
    child_price = models.FloatField(default=0)
    infant_price = models.FloatField(default=0)
    type= models.CharField(max_length=50)
    min_days=models.CharField(max_length=50)
    max_days=models.CharField(max_length=50)
    airpot_name=models.CharField(max_length=100,blank=True, null=True)
    city = models.ForeignKey(
        "City", on_delete=models.CASCADE, related_name="only_visa_prices",blank=True, null=True
    )
    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active", blank=True, null=True)

    # New explicit per-person selling/purchase fields (kept alongside legacy fields)
    adult_selling_price = models.FloatField(default=0)
    adult_purchase_price = models.FloatField(default=0)
    child_selling_price = models.FloatField(default=0)
    child_purchase_price = models.FloatField(default=0)
    infant_selling_price = models.FloatField(default=0)
    infant_purchase_price = models.FloatField(default=0)

    # Support both 'only' and 'long_term' visa options in a single table
    VISA_OPTION_CHOICES = (
        ("only", "Only"),
        ("long_term", "Long Term"),
    )
    visa_option = models.CharField(max_length=20, choices=VISA_OPTION_CHOICES, default="only")

    # Optional long-term specific fields (only used when visa_option='long_term')
    validity_days = models.IntegerField(null=True, blank=True, help_text="Optional validity/duration in days for long term visas")
    multi_entry = models.BooleanField(default=False, help_text="Whether this visa supports multiple entry (long-term)")
    long_term_discount_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Optional discount percentage for long-term visas")
    
    # Human-friendly title for this price record (admin UI uses this)
    title = models.CharField(max_length=255, blank=True, null=True)

    # Whether this visa price includes transport (frontend: withTransport)
    is_transport = models.BooleanField(default=False)

    # Optional relation to small sectors (transport sectors) to indicate which sectors
    # this visa price can be paired with in the agent UI. Use string reference to avoid
    # circular import issues at module import time.
    sectors = models.ManyToManyField('booking.Sector', related_name='only_visa_prices', blank=True)

    def __str__(self):
        return f"{self.organization} - {self.city} ({self.type})"



class TransportSectorPrice(models.Model):
    """
    Model to store the details of a Transport Sector.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="transport_sectors"
    )
    reference= models.CharField(max_length=100,default="type1")
    name = models.CharField(max_length=100)
    vehicle_type = models.IntegerField(blank=True, null=True)
    adault_price = models.FloatField(default=0)
    child_price = models.FloatField(default=0)
    infant_price = models.FloatField(default=0)
    is_visa = models.BooleanField(default=False)
    only_transport_charge = models.BooleanField(default=False)

        # New explicit per-person selling/purchase fields
    # adult_selling_price = models.FloatField(default=0)
    # adult_purchase_price = models.FloatField(default=0)
    # child_selling_price = models.FloatField(default=0)
    # child_purchase_price = models.FloatField(default=0)
    # infant_selling_price = models.FloatField(default=0)
    # infant_purchase_price = models.FloatField(default=0)


    def __str__(self):
        return self.name


class Airlines(models.Model):
    """
    Model to store the details of an Airline.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="airlines"
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    logo = models.ImageField(upload_to="media/airlines_logos/", blank=True, null=True)
    is_umrah_seat = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class City(models.Model):
    """
    Model to store the details of a City.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="cities"
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10)

    def __str__(self):
        return self.name


class FoodPrice(models.Model):
    """
    Model to store the food prices.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="food_prices"
    )
    city = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="food_prices", null=True,blank=True
    )
    description = models.TextField(blank=True, null=True)
    title = models.CharField(max_length=100)
    min_pex=models.IntegerField(default=0)  
    per_pex= models.IntegerField(default=0) 
    active = models.BooleanField(default=False)
    price = models.FloatField(default=0)
    # Purchase/cost to the seller (frontend uses this for package cost)
    purchase_price = models.FloatField(default=0)
    # New explicit per-person selling/purchase fields
    adult_selling_price = models.FloatField(default=0)
    adult_purchase_price = models.FloatField(default=0)
    child_selling_price = models.FloatField(default=0)
    child_purchase_price = models.FloatField(default=0)
    infant_selling_price = models.FloatField(default=0)
    infant_purchase_price = models.FloatField(default=0)
    def __str__(self):
        city_name = self.city.name if self.city else 'No City'
        return f"{self.title} ({city_name})"

class ZiaratPrice(models.Model):
    """
    Model to store the Ziarat prices.
    """
    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
    )

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="ziarat_prices"
    )
    city = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="ziarat_prices", null=True,blank=True
    )
    ziarat_title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    contact_person = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15)
    price = models.FloatField(default=0)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="active"
    )
    min_pex = models.FloatField(default=0) 
    max_pex = models.FloatField(default=0)
    # Purchase/cost to the seller for ziarat
    purchase_price = models.FloatField(default=0)
    # New explicit per-person selling/purchase fields
    adult_selling_price = models.FloatField(default=0)
    adult_purchase_price = models.FloatField(default=0)
    child_selling_price = models.FloatField(default=0)
    child_purchase_price = models.FloatField(default=0)
    infant_selling_price = models.FloatField(default=0)
    infant_purchase_price = models.FloatField(default=0)
    def __str__(self):
        city_name = self.city.name if self.city else 'No City'
        return f"{self.ziarat_title} ({city_name})"

class BookingExpiry(models.Model):
    """
    Model to store the booking expiry time.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="booking_expiries"
    )
    umrah_expiry_time = models.IntegerField(default=0)  # Time in minutes
    ticket_expiry_time = models.IntegerField(default=0)  # Time in minutes
    customer_expiry_time = models.IntegerField(default=0)  # Time in minutes (for public/customer bookings)
    custom_umrah_expiry_time = models.IntegerField(default=0)  # Time in minutes (for custom Umrah packages)


class UmrahPackage(models.Model):
    """
    Enhanced model to store complete Umrah packages including hotels, transport, flights, visa.
    Supports multi-organization visibility, dynamic pricing, and booking integration.
    """
    
    PACKAGE_TYPE_CHOICES = (
        ('umrah', 'Umrah Package'),
        ('visa', 'Visa Only'),
        ('package', 'Custom Package'),
        ('hotel', 'Hotel Only'),
        ('transport', 'Transport Only'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
        ('sold_out', 'Sold Out'),
    )
    
    # Auto-generated package code
    package_code = models.CharField(max_length=50, unique=True, editable=False, blank=True)
    
    # Basic Details
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="umrah_packages"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_packages',
        db_constraint=False  # Disable FK constraint for MySQL compatibility
    )
    title = models.CharField(max_length=200, help_text="Package name (e.g., 'Ramzan Umrah Gold 2025')")
    description = models.TextField(blank=True, null=True, help_text="Detailed package description")
    
    # Package Type and Status
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPE_CHOICES, default='umrah')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Validity Period
    start_date = models.DateField(null=True, blank=True, help_text="Package available from this date")
    end_date = models.DateField(null=True, blank=True, help_text="Package available till this date")
    
    # Capacity Management
    max_capacity = models.IntegerField(default=0, help_text="Total seats/slots available")
    total_seats = models.BigIntegerField(default=0, blank=True, null=True)
    left_seats = models.BigIntegerField(default=0, blank=True, null=True)
    booked_seats = models.BigIntegerField(default=0, blank=True, null=True)
    confirmed_seats = models.BigIntegerField(default=0, blank=True, null=True)
    
    # Pricing Details
    price_per_person = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Base price per person"
    )
    
    # Visa Pricing — keep explicit selling/purchase fields; remove legacy single price fields
    rules = models.TextField(blank=True, null=True)
    # Explicit selling / purchase fields for top-level visa prices
    adault_visa_selling_price = models.FloatField(default=0)
    adault_visa_purchase_price = models.FloatField(default=0)
    child_visa_selling_price = models.FloatField(default=0)
    child_visa_purchase_price = models.FloatField(default=0)
    infant_visa_selling_price = models.FloatField(default=0)
    infant_visa_purchase_price = models.FloatField(default=0)
    
    # Additional Services — keep explicit selling/purchase fields only
    # Food
    food_selling_price = models.FloatField(default=0)
    food_purchase_price = models.FloatField(default=0)
    # Makkah Ziyarat (selling/purchase)
    makkah_ziyarat_selling_price = models.FloatField(default=0)
    makkah_ziyarat_purchase_price = models.FloatField(default=0)
    # Madinah Ziyarat (selling/purchase)
    madinah_ziyarat_selling_price = models.FloatField(default=0)
    madinah_ziyarat_purchase_price = models.FloatField(default=0)
    # Transport (selling/purchase)
    transport_selling_price = models.FloatField(default=0)
    transport_purchase_price = models.FloatField(default=0)

    # --- Calculated Total Package Prices (per occupancy) ---
    # Adult Occupancies
    sharing_selling_price = models.FloatField(default=0)
    sharing_purchase_price = models.FloatField(default=0)
    double_selling_price = models.FloatField(default=0)
    double_purchase_price = models.FloatField(default=0)
    triple_selling_price = models.FloatField(default=0)
    triple_purchase_price = models.FloatField(default=0)
    quad_selling_price = models.FloatField(default=0)
    quad_purchase_price = models.FloatField(default=0)
    quaint_selling_price = models.FloatField(default=0)
    quaint_purchase_price = models.FloatField(default=0)
    
    # Child Without Bed (Extras Only)
    child_without_bed_selling_price = models.FloatField(default=0)
    child_without_bed_purchase_price = models.FloatField(default=0)

    # Child With Bed (Occupancy Based)
    child_sharing_selling_price = models.FloatField(default=0)
    child_sharing_purchase_price = models.FloatField(default=0)
    child_double_selling_price = models.FloatField(default=0)
    child_double_purchase_price = models.FloatField(default=0)
    child_triple_selling_price = models.FloatField(default=0)
    child_triple_purchase_price = models.FloatField(default=0)
    child_quad_selling_price = models.FloatField(default=0)
    child_quad_purchase_price = models.FloatField(default=0)
    child_quaint_selling_price = models.FloatField(default=0)
    child_quaint_purchase_price = models.FloatField(default=0)

    # Infant (Single calculated price = Infant Visa + Infant Ticket)
    infant_package_selling_price = models.FloatField(default=0)
    infant_package_purchase_price = models.FloatField(default=0)

    def calculate_and_save_prices(self):
        """
        Calculate total package prices based on components and save to DB fields.
        Formula:
          Adult Total(Occupancy) = Sum(Hotel_Price(Occupancy) * Nights) + Transport + Adult_Extras
          Child With Bed Total(Occupancy) = Sum(Hotel_Price(Occupancy) * Nights) + Transport + Child_Extras
          Child Without Bed Total = Transport + Child_Extras (No Hotel)
          Infant Total = Infant_Ticket + Infant_Visa
        """
        # 1. Calculate Component Totals
        
        # A. Hotels (Selling & Purchase)
        hotel_selling = {
            'sharing': 0, 'double': 0, 'triple': 0, 'quad': 0, 'quaint': 0
        }
        hotel_purchase = {
            'sharing': 0, 'double': 0, 'triple': 0, 'quad': 0, 'quaint': 0
        }
        
        for hd in self.hotel_details.all():
            nights = hd.number_of_nights or 0
            
            # Selling
            hotel_selling['sharing'] += (hd.sharing_bed_selling_price or 0) * nights
            hotel_selling['double'] += (hd.double_bed_selling_price or 0) * nights
            hotel_selling['triple'] += (hd.triple_bed_selling_price or 0) * nights
            hotel_selling['quad'] += (hd.quad_bed_selling_price or 0) * nights
            hotel_selling['quaint'] += (hd.quaint_bed_selling_price or 0) * nights
            
            # Purchase
            hotel_purchase['sharing'] += (hd.sharing_bed_purchase_price or 0) * nights
            hotel_purchase['double'] += (hd.double_bed_purchase_price or 0) * nights
            hotel_purchase['triple'] += (hd.triple_bed_purchase_price or 0) * nights
            hotel_purchase['quad'] += (hd.quad_bed_purchase_price or 0) * nights
            hotel_purchase['quaint'] += (hd.quaint_bed_purchase_price or 0) * nights

        # B. Transport
        transport_selling_total = 0
        transport_purchase_total = 0
        for td in self.transport_details.all():
             transport_selling_total += (td.transport_selling_price or 0)
             transport_purchase_total += (td.transport_purchase_price or 0)
        
        self.transport_selling_price = transport_selling_total
        self.transport_purchase_price = transport_purchase_total

        # C. Fixed Costs
        
        # 1. Visa
        # Adult
        adult_visa_selling = self.adault_visa_selling_price or 0
        adult_visa_purchase = self.adault_visa_purchase_price or 0
        # Child
        child_visa_selling = self.child_visa_selling_price or 0
        child_visa_purchase = self.child_visa_purchase_price or 0
        # Infant
        infant_visa_selling = self.infant_visa_selling_price or 0
        infant_visa_purchase = self.infant_visa_purchase_price or 0
        
        # 2. Food (Adult & Child)
        food_selling = self.food_selling_price or 0
        food_purchase = self.food_purchase_price or 0
        
        # 3. Ziyarat (Adult & Child)
        makkah_selling = self.makkah_ziyarat_selling_price or 0
        makkah_purchase = self.makkah_ziyarat_purchase_price or 0
        madinah_selling = self.madinah_ziyarat_selling_price or 0
        madinah_purchase = self.madinah_ziyarat_purchase_price or 0
        
        ziarat_selling = makkah_selling + madinah_selling
        ziarat_purchase = makkah_purchase + madinah_purchase
        
        # 4. Ticket (First ticket found)
        # Adult
        adult_ticket_selling = 0
        adult_ticket_purchase = 0
        # Child
        child_ticket_selling = 0
        child_ticket_purchase = 0
        # Infant
        infant_ticket_selling = 0
        infant_ticket_purchase = 0

        first_ticket_detail = self.ticket_details.first()
        if first_ticket_detail and first_ticket_detail.ticket:
             ticket = first_ticket_detail.ticket
             # Adult (uses adult_price)
             adult_ticket_selling = ticket.adult_price or 0
             adult_ticket_purchase = ticket.adult_purchase_price or 0
             
             # Child Logic: Adult Price - Child Price (Discount)
             child_discount_selling = ticket.child_price or 0
             child_discount_purchase = ticket.child_purchase_price or 0
             
             child_ticket_selling = max(0, adult_ticket_selling - child_discount_selling)
             child_ticket_purchase = max(0, adult_ticket_purchase - child_discount_purchase)
             
             # Infant Logic
             infant_ticket_selling = ticket.infant_price or 0
             infant_ticket_purchase = ticket.infant_purchase_price or 0

        # --- Base Extras Sums ---
        
        # Common (Transport + Food + Ziyarat) - Applies to Adult and Child
        common_selling = transport_selling_total + food_selling + ziarat_selling
        common_purchase = transport_purchase_total + food_purchase + ziarat_purchase

        # Adult Extras
        adult_extras_selling = common_selling + adult_visa_selling + adult_ticket_selling
        adult_extras_purchase = common_purchase + adult_visa_purchase + adult_ticket_purchase

        # Child Extras
        child_extras_selling = common_selling + child_visa_selling + child_ticket_selling
        child_extras_purchase = common_purchase + child_visa_purchase + child_ticket_purchase

        # Infant Total (Ticket + Visa Only)
        self.infant_package_selling_price = infant_ticket_selling + infant_visa_selling
        self.infant_package_purchase_price = infant_ticket_purchase + infant_visa_purchase

        # 2. Set Totals
        
        # Adult Occupancies
        self.sharing_selling_price = hotel_selling['sharing'] + adult_extras_selling
        self.sharing_purchase_price = hotel_purchase['sharing'] + adult_extras_purchase
        
        self.double_selling_price = hotel_selling['double'] + adult_extras_selling
        self.double_purchase_price = hotel_purchase['double'] + adult_extras_purchase
        
        self.triple_selling_price = hotel_selling['triple'] + adult_extras_selling
        self.triple_purchase_price = hotel_purchase['triple'] + adult_extras_purchase
        
        self.quad_selling_price = hotel_selling['quad'] + adult_extras_selling
        self.quad_purchase_price = hotel_purchase['quad'] + adult_extras_purchase
        
        self.quaint_selling_price = hotel_selling['quaint'] + adult_extras_selling
        self.quaint_purchase_price = hotel_purchase['quaint'] + adult_extras_purchase

        # Child Without Bed (Extras Only)
        self.child_without_bed_selling_price = child_extras_selling
        self.child_without_bed_purchase_price = child_extras_purchase

        # Child With Bed (Occupancy Based)
        self.child_sharing_selling_price = hotel_selling['sharing'] + child_extras_selling
        self.child_sharing_purchase_price = hotel_purchase['sharing'] + child_extras_purchase
        
        self.child_double_selling_price = hotel_selling['double'] + child_extras_selling
        self.child_double_purchase_price = hotel_purchase['double'] + child_extras_purchase
        
        self.child_triple_selling_price = hotel_selling['triple'] + child_extras_selling
        self.child_triple_purchase_price = hotel_purchase['triple'] + child_extras_purchase
        
        self.child_quad_selling_price = hotel_selling['quad'] + child_extras_selling
        self.child_quad_purchase_price = hotel_purchase['quad'] + child_extras_purchase
        
        self.child_quaint_selling_price = hotel_selling['quaint'] + child_extras_selling
        self.child_quaint_purchase_price = hotel_purchase['quaint'] + child_extras_purchase

        self.save()

    # Selected option IDs (persist which dropdown option was chosen)
    food_price_id = models.IntegerField(blank=True, null=True)
    makkah_ziyarat_id = models.IntegerField(blank=True, null=True)
    madinah_ziyarat_id = models.IntegerField(blank=True, null=True)
    
    # Room Type Activation
    is_active = models.BooleanField(default=True)
    is_quaint_active = models.BooleanField(default=True)
    is_sharing_active = models.BooleanField(default=True)
    is_quad_active = models.BooleanField(default=True)
    is_triple_active = models.BooleanField(default=True)
    is_double_active = models.BooleanField(default=True)
    
    # Service Charges
    adault_service_charge = models.FloatField(default=0)
    child_service_charge = models.FloatField(default=0)
    infant_service_charge = models.FloatField(default=0)
    is_service_charge_active = models.BooleanField(default=False)
    
    # Partial Payment
    adault_partial_payment = models.FloatField(default=0)
    child_partial_payment = models.FloatField(default=0)
    infant_partial_payment = models.FloatField(default=0)
    is_partial_payment_active = models.BooleanField(default=False)
    min_partial_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    min_partial_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    
    # Age Restrictions
    filght_min_adault_age = models.IntegerField(default=0) 
    filght_max_adault_age = models.IntegerField(default=0) 
    max_chilld_allowed = models.IntegerField(default=0) 
    max_infant_allowed = models.IntegerField(default=0) 
    
    # Multi-Organization Support
    inventory_owner_organization_id = models.IntegerField(blank=True, null=True)
    reselling_allowed = models.BooleanField(default=False, help_text="Allow reselling by other organizations")
    
    # Public Visibility
    is_public = models.BooleanField(default=False, help_text="Visible for public bookings")
    available_start_date = models.DateField(blank=True, null=True)
    available_end_date = models.DateField(blank=True, null=True)
    
    # Commission Configuration
    area_agent_commission_adult = models.FloatField(default=0, blank=True, null=True)
    area_agent_commission_child = models.FloatField(default=0, blank=True, null=True)
    area_agent_commission_infant = models.FloatField(default=0, blank=True, null=True)
    branch_commission_adult = models.FloatField(default=0, blank=True, null=True)
    branch_commission_child = models.FloatField(default=0, blank=True, null=True)
    branch_commission_infant = models.FloatField(default=0, blank=True, null=True)
    
    # Pricing Rules
    profit_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Profit percentage on base price"
    )
    # discount_link removed temporarily - add when promotion_center.Promotion model is created
    # discount_link = models.ForeignKey(
    #     'promotion_center.Promotion',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='packages',
    #     help_text="Link to promotion/discount"
    # )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Umrah Package"
        verbose_name_plural = "Umrah Packages"
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Auto-generate package_code if not exists
        if not self.package_code:
            date_str = datetime.now().strftime('%Y%m%d')
            random_str = secrets.token_hex(2).upper()
            self.package_code = f"PKG-{date_str}-{random_str}"
        
        # Auto-calculate available slots
        if self.max_capacity:
            self.left_seats = self.max_capacity - (self.booked_seats or 0)
        
        super().save(*args, **kwargs)
    
    def calculate_total_price(self, adults=1, children=0, infants=0):
        """Calculate total package price for given number of persons"""
        total = 0
        total += adults * float(self.price_per_person)
        
        # Add visa prices
        # use explicit selling price fields (removed legacy single-price fields)
        total += adults * float(getattr(self, 'adault_visa_selling_price', 0) or 0)
        total += children * float(getattr(self, 'child_visa_selling_price', 0) or 0)
        total += infants * float(getattr(self, 'infant_visa_selling_price', 0) or 0)
        
        # Add service charges if active
        if self.is_service_charge_active:
            total += adults * float(self.adault_service_charge or 0)
            total += children * float(self.child_service_charge or 0)
            total += infants * float(self.infant_service_charge or 0)
        
        # Add profit (previously called markup_percent)
        if getattr(self, 'profit_percent', None):
            total += total * (float(self.profit_percent) / 100)
        
        return round(total, 2)

    # --- New helper pricing methods matching requested formulas ---
    def _first_ticket_obj(self):
        """Return the first Ticket object included in this package, if any."""
        first = self.ticket_details.first()
        if not first or not getattr(first, 'ticket', None):
            return None
        return first.ticket

    def infant_price(self):
        """INFANT PRICE = INFANT TICKET SELLING PRICE + INFANT VISA SELLING PRICE"""
        ticket = self._first_ticket_obj()
        ticket_infant = 0
        if ticket:
            ticket_infant = getattr(ticket, 'infant_price', 0) or 0
        visa_infant = float(getattr(self, 'infant_visa_selling_price', 0) or 0)
        return float(ticket_infant) + visa_infant

    def child_discount(self):
        """CHILD DISCOUNT = ADULT TICKET SELLING PRICE - CHILD TICKET SELLING PRICE"""
        ticket = self._first_ticket_obj()
        if not ticket:
            return 0
        adult_ticket = getattr(ticket, 'adult_price', 0) or 0
        child_ticket = getattr(ticket, 'child_price', 0) or 0
        return float(adult_ticket) - float(child_ticket)

    def adult_cost(self):
        """Adult cost = food + makkah + madinah + transport + adult visa + adult ticket"""
        food = float(getattr(self, 'food_selling_price', 0) or 0)
        makkah = float(getattr(self, 'makkah_ziyarat_selling_price', 0) or 0)
        madinah = float(getattr(self, 'madinah_ziyarat_selling_price', 0) or 0)
        transport = float(getattr(self, 'transport_selling_price', 0) or 0)
        visa = float(getattr(self, 'adault_visa_selling_price', 0) or 0)
        ticket = self._first_ticket_obj()
        ticket_adult = float(getattr(ticket, 'adult_price', 0) or 0) if ticket else 0
        return food + makkah + madinah + transport + visa + ticket_adult

    def _sum_hotel_room_component(self, room_field_name):
        """Sum across all hotel_details: hotel.<room_field_name>_selling_price * number_of_nights"""
        total = 0
        for hd in self.hotel_details.all():
            price = getattr(hd, room_field_name, None)
            nights = getattr(hd, 'number_of_nights', 0) or 0
            if price is None:
                continue
            total += float(price or 0) * int(nights)
        return total

    def room_cost(self, room_type):
        """Compute total cost for a room type per your formulas.

        room_type: one of 'sharing','quad','quint','double','triple'
        """
        base = float(self.adult_cost() or 0)
        # Map requested room types to model field names
        mapping = {
            'sharing': 'sharing_bed_selling_price',
            'quad': 'quad_bed_selling_price',
            'quint': 'quaint_bed_selling_price',  # model uses 'quaint' (typo) for quint
            'double': 'double_bed_selling_price',
            'triple': 'triple_bed_selling_price',
        }
        field = mapping.get(room_type)
        if not field:
            return base
        hotel_component = self._sum_hotel_room_component(field)
        return base + hotel_component

    def sharing_cost(self):
        return self.room_cost('sharing')

    def quad_cost(self):
        return self.room_cost('quad')

    def quint_cost(self):
        return self.room_cost('quint')

    def double_cost(self):
        return self.room_cost('double')

    def triple_cost(self):
        return self.room_cost('triple')
    
    def get_available_slots(self):
        """Get current available slots"""
        return self.max_capacity - (self.booked_seats or 0)
    
    def __str__(self):
        return f"{self.package_code} - {self.title}"


class PackageInclusion(models.Model):
    """
    Model to store package inclusions (what's included in the package).
    Examples: Visa processing, Hotel nights, Meals, Transport, Ziyarat, etc.
    """
    package = models.ForeignKey(
        UmrahPackage,
        on_delete=models.CASCADE,
        related_name='inclusions'
    )
    title = models.CharField(max_length=200, help_text="e.g., 'Visa processing', '5-star hotel 5 nights'")
    description = models.TextField(blank=True, null=True)
    display_order = models.IntegerField(default=0, help_text="Order to display in list")
    
    class Meta:
        ordering = ['display_order', 'id']
        verbose_name = "Package Inclusion"
        verbose_name_plural = "Package Inclusions"
    
    def __str__(self):
        return f"{self.package.package_code} - {self.title}"


class PackageExclusion(models.Model):
    """
    Model to store package exclusions (what's NOT included in the package).
    Examples: Airfare, Personal expenses, Extra baggage, etc.
    """
    package = models.ForeignKey(
        UmrahPackage,
        on_delete=models.CASCADE,
        related_name='exclusions'
    )
    title = models.CharField(max_length=200, help_text="e.g., 'Airfare', 'Personal expenses'")
    description = models.TextField(blank=True, null=True)
    display_order = models.IntegerField(default=0, help_text="Order to display in list")
    
    class Meta:
        ordering = ['display_order', 'id']
        verbose_name = "Package Exclusion"
        verbose_name_plural = "Package Exclusions"
    
    def __str__(self):
        return f"{self.package.package_code} - {self.title}"


class UmrahPackageHotelDetails(models.Model):
    package = models.ForeignKey(
        UmrahPackage, on_delete=models.CASCADE, related_name="hotel_details"
    )
    hotel = models.ForeignKey("tickets.Hotels", on_delete=models.PROTECT)
    check_in_date=models.DateField(blank=True, null=True)
    check_out_date=models.DateField(blank=True, null=True)
    number_of_nights = models.IntegerField(default=0)
    quaint_bed_price = models.FloatField(default=0)
    sharing_bed_price = models.FloatField(default=0)
    quad_bed_price = models.FloatField(default=0)
    triple_bed_price = models.FloatField(default=0)
    double_bed_price = models.FloatField(default=0)
    # New explicit selling / purchasing fields to store both sides of pricing
    quaint_bed_selling_price = models.FloatField(default=0)
    quaint_bed_purchase_price = models.FloatField(default=0)
    sharing_bed_selling_price = models.FloatField(default=0)
    sharing_bed_purchase_price = models.FloatField(default=0)
    quad_bed_selling_price = models.FloatField(default=0)
    quad_bed_purchase_price = models.FloatField(default=0)
    triple_bed_selling_price = models.FloatField(default=0)
    triple_bed_purchase_price = models.FloatField(default=0)
    double_bed_selling_price = models.FloatField(default=0)
    double_bed_purchase_price = models.FloatField(default=0)

class UmrahPackageTransportDetails(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('sedan', 'Sedan Car'),
        ('suv', 'SUV'),
        ('van', 'Van'),
        ('minibus', 'Mini Bus'),
        ('coaster', 'Coaster'),
        ('bus', 'Large Bus'),
        ('luxury_bus', 'Luxury Bus'),
        ('hiace', 'Hiace'),
    ]
    
    TRANSPORT_TYPE_CHOICES = [
        ('private', 'Private Transport'),
        ('shared', 'Shared Transport'),
        ('one_way', 'One Way'),
        ('round_trip', 'Round Trip'),
        ('airport_transfer', 'Airport Transfer'),
        ('intercity', 'Intercity'),
        ('local', 'Local Transport'),
    ]
    
    package = models.ForeignKey(
        UmrahPackage, on_delete=models.CASCADE, related_name="transport_details"
    )
    transport_sector = models.ForeignKey(
        "booking.VehicleType", on_delete=models.PROTECT, blank=True, null=True
    )   
    vehicle_type = models.CharField(max_length=50, choices=VEHICLE_TYPE_CHOICES, blank=True, null=True)
    transport_type = models.CharField(max_length=50, choices=TRANSPORT_TYPE_CHOICES, blank=True, null=True)
    # Per-transport selling and purchase prices (stored per transport row)
    transport_selling_price = models.FloatField(default=0)
    transport_purchase_price = models.FloatField(default=0)
    
    class Meta:
        verbose_name = "Transport Detail"
        verbose_name_plural = "Transport Details"
    
    def __str__(self):
        vehicle = self.get_vehicle_type_display() if self.vehicle_type else 'N/A'
        transport = self.get_transport_type_display() if self.transport_type else 'N/A'
        return f"{self.package} - {vehicle} ({transport})"

class UmrahPackageTicketDetails(models.Model):
    package= models.ForeignKey(
        UmrahPackage, on_delete=models.CASCADE, related_name="ticket_details")
    ticket= models.ForeignKey("tickets.Ticket", on_delete=models.PROTECT)

class UmrahPackageDiscountDetails(models.Model):
    package= models.ForeignKey(
        UmrahPackage, on_delete=models.CASCADE, related_name="discount_details")
    adault_from= models.IntegerField(default=0) 
    adault_to= models.IntegerField(default=0)  
    max_discount= models.FloatField(default=0)  

class  CustomUmrahPackage(models.Model):
    """
    Model to store the details of a Custom Umrah Package.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="custom_umrah_packages"
    )
    # agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name="custom_umrah_packages")
    agency= models.ForeignKey(Agency, on_delete=models.CASCADE, related_name="custom_umrah_packages")
    user = models.ForeignKey(   # 👈 naya field
        User, on_delete=models.CASCADE, related_name="custom_umrah_packages", blank=True, null=True
    )
    total_adaults = models.IntegerField(default=0)
    total_children = models.IntegerField(default=0)
    total_infants = models.IntegerField(default=0)
    child_visa_price = models.FloatField(default=0)
    infant_visa_price = models.FloatField(default=0)
    adault_visa_price = models.FloatField(default=0) 
    long_term_stay = models.BooleanField(default=False)
    is_full_transport = models.BooleanField(default=False)
    is_one_side_transport = models.BooleanField(default=False)
    only_visa = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status field with choices
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    def __str__(self):
        return f"Custom Package #{self.id} - {self.agency.name if self.agency else 'N/A'}"
    
    class Meta:
        verbose_name = "Custom Umrah Package"
        verbose_name_plural = "Custom Umrah Packages"
        ordering = ['-created_at']



class CustomUmrahPackageHotelDetails(models.Model):
    ROOM_TYPE_CHOICES = [
        ('standard', 'Standard'),
        ('deluxe', 'Deluxe'),
        ('suite', 'Suite'),
        ('executive', 'Executive'),
        ('presidential', 'Presidential'),
        ('family', 'Family Room'),
        ('economy', 'Economy'),
    ]
    
    SHARING_TYPE_CHOICES = [
        ('single', 'Single (1 Person)'),
        ('double', 'Double (2 Persons)'),
        ('triple', 'Triple (3 Persons)'),
        ('quad', 'Quad (4 Persons)'),
        ('quint', 'Quint (5 Persons)'),
        ('sharing', 'Sharing (Multiple)'),
    ]
    
    package = models.ForeignKey(
        CustomUmrahPackage, on_delete=models.CASCADE, related_name="hotel_details"
    )
    hotel = models.ForeignKey("tickets.Hotels", on_delete=models.PROTECT)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, blank=True, null=True)
    quantity = models.FloatField(default=0)
    sharing_type = models.CharField(max_length=20, choices=SHARING_TYPE_CHOICES, blank=True, null=True)
    check_in_date=models.DateField(blank=True, null=True)
    check_out_date=models.DateField(blank=True, null=True)
    number_of_nights = models.IntegerField(default=0)
    special_request = models.TextField(blank=True, null=True)
    price= models.FloatField(default=0)
    
    class Meta:
        verbose_name = "Hotel Detail"
        verbose_name_plural = "Hotel Details"
    
    def __str__(self):
        room_display = self.get_room_type_display() if self.room_type else 'N/A'
        sharing_display = self.get_sharing_type_display() if self.sharing_type else 'N/A'
        return f"{self.hotel} - {room_display} ({sharing_display})"

class CustomUmrahPackageTransportDetails(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('sedan', 'Sedan Car'),
        ('suv', 'SUV'),
        ('van', 'Van'),
        ('minibus', 'Mini Bus'),
        ('coaster', 'Coaster'),
        ('bus', 'Large Bus'),
        ('luxury_bus', 'Luxury Bus'),
        ('hiace', 'Hiace'),
    ]
    
    TRANSPORT_TYPE_CHOICES = [
        ('private', 'Private Transport'),
        ('shared', 'Shared Transport'),
        ('one_way', 'One Way'),
        ('round_trip', 'Round Trip'),
        ('airport_transfer', 'Airport Transfer'),
        ('intercity', 'Intercity'),
        ('local', 'Local Transport'),
    ]
    
    package = models.ForeignKey(
        CustomUmrahPackage, on_delete=models.CASCADE, related_name="transport_details"
    )
    # transport_sector = models.ForeignKey(
    #     TransportSectorPrice, on_delete=models.PROTECT
    # )   
    vehicle_type = models.CharField(max_length=50, choices=VEHICLE_TYPE_CHOICES, blank=True, null=True)
    transport_type = models.CharField(max_length=50, choices=TRANSPORT_TYPE_CHOICES, blank=True, null=True)
    # Per-transport selling and purchase prices for custom packages
    transport_selling_price = models.FloatField(default=0)
    transport_purchase_price = models.FloatField(default=0)
    
    class Meta:
        verbose_name = "Custom Transport Detail"
        verbose_name_plural = "Custom Transport Details"
    
    def __str__(self):
        vehicle = self.get_vehicle_type_display() if self.vehicle_type else 'N/A'
        transport = self.get_transport_type_display() if self.transport_type else 'N/A'
        return f"{vehicle} - {transport}"


class CustomUmrahPackageTicketDetails(models.Model):
    package= models.ForeignKey(
        CustomUmrahPackage, on_delete=models.CASCADE, related_name="ticket_details")
    ticket= models.ForeignKey("tickets.Ticket", on_delete=models.PROTECT)


class CustomUmrahZiaratDetails(models.Model):
    package = models.ForeignKey(
        CustomUmrahPackage, on_delete=models.CASCADE, related_name="ziarat_details"
    )
    ziarat = models.ForeignKey(ZiaratPrice, on_delete=models.PROTECT)

class CustomUmrahFoodDetails(models.Model):
    package = models.ForeignKey(
        CustomUmrahPackage, on_delete=models.CASCADE, related_name="food_details"
    )
    food = models.ForeignKey(FoodPrice, on_delete=models.PROTECT)
