
from django.contrib.auth.models import User
from django.db import models
from .utils import generate_organization_id


# ===== Employee Model =====
class Employee(models.Model):
    """
    Employee model - separate table for employee management
    Links: Employee → Agency → Branch → Organization
    """
    
    # Link to Django User for authentication (optional)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', 
                                null=True, blank=True)
    
    # Personal Information
    employee_code = models.CharField(max_length=20, unique=True, editable=False, null=True, blank=True, 
                                     help_text="Auto-generated code like EMP-0001")
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Employment Details - Only Agency link (Branch/Org are derived)
    agency = models.ForeignKey('Agency', on_delete=models.CASCADE, related_name='employees', 
                               help_text="Agency this employee belongs to")
    date_joined = models.DateField(auto_now_add=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Employment Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Position/Role
    POSITION_CHOICES = [
        ('manager', 'Manager'),
        ('sales_executive', 'Sales Executive'),
        ('customer_service', 'Customer Service Representative'),
        ('accountant', 'Accountant'),
        ('operations', 'Operations Officer'),
        ('marketing', 'Marketing Executive'),
        ('ticketing_agent', 'Ticketing Agent'),
        ('travel_consultant', 'Travel Consultant'),
        ('supervisor', 'Supervisor'),
        ('assistant', 'Assistant'),
        ('other', 'Other'),
    ]
    position = models.CharField(max_length=100, choices=POSITION_CHOICES, blank=True, null=True, help_text="Job title or position")
    department = models.CharField(max_length=100, blank=True, null=True)
    
    # Salary/Commission
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, 
                                          help_text="Commission percentage")
    
    # Additional Information
    profile_photo = models.ImageField(upload_to='employee_photos/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='created_employees')
    
    class Meta:
        verbose_name = "Employee"
        verbose_name_plural = "Employees"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee_code']),
            models.Index(fields=['email']),
            models.Index(fields=['agency']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate employee code if not set
        if not self.employee_code:
            self.employee_code = generate_organization_id("employee")
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_code})"
    
    @property
    def full_name(self):
        """Get employee's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def branch(self):
        """Get the branch through agency"""
        return self.agency.branch if self.agency else None
    
    @property
    def organization(self):
        """Get the organization through agency → branch"""
        return self.agency.branch.organization if self.agency and self.agency.branch else None


# AgencyProfile model for agency relationship and work overview
class AgencyProfile(models.Model):
    agency = models.OneToOneField('organization.Agency', on_delete=models.CASCADE)
    relationship_status = models.CharField(max_length=50, default='active')
    relation_history = models.JSONField(default=list)
    working_with_companies = models.JSONField(default=list)
    performance_summary = models.JSONField(default=dict)
    recent_communication = models.JSONField(default=list)
    conflict_history = models.JSONField(default=list)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_agency_profiles')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_agency_profiles')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)



class Organization(models.Model):
    user = models.ManyToManyField(User, related_name="organizations")
    # Auto-generated organization code (ORG-0001, ORG-0002, ...) - for display only
    org_code = models.CharField(max_length=20, unique=True, editable=False, null=True, blank=True, help_text="Display code like ORG-0001")
    name = models.CharField(max_length=30)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    logo = models.ImageField(
        upload_to="media/organization_logos", blank=True, null=True
    )

    def save(self, *args, **kwargs):
        # Auto-generate org_code if not set
        if not self.org_code:
            self.org_code = generate_organization_id("organization")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.org_code})" if self.org_code else self.name


class Branch(models.Model):
    user = models.ManyToManyField(User, related_name="branches")
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="branches"
    )
    # Auto-generated branch code (BRN-0001, BRN-0002, ...) - for display only
    branch_code = models.CharField(max_length=20, unique=True, editable=False, null=True, blank=True, help_text="Display code like BRN-0001")
    name = models.CharField(max_length=30)
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    # optional commission account identifier for this branch
    commission_id = models.CharField(max_length=64, null=True, blank=True)

    def save(self, *args, **kwargs):
        # Auto-generate branch_code if not set
        if not self.branch_code:
            self.branch_code = generate_organization_id("branch")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.branch_code})" if self.branch_code else self.name


class Agency(models.Model):
    user = models.ManyToManyField(User, related_name="agencies")
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="agencies"
    )
    logo = models.ImageField(
        upload_to="media/agency_logos", blank=True, null=True )
    name = models.CharField(max_length=30)
    ageny_name = models.CharField(max_length=30, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    agreement_status = models.BooleanField(default=False)
    
    # New fields for API 8
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    credit_limit_days = models.IntegerField(null=True, blank=True)

    AGENCY_TYPE_CHOICES = [
        ("Area Agency", "Area Agency"),
        ("Full Agency", "Full Agency"),
    ]
    agency_type = models.CharField(max_length=50, choices=AGENCY_TYPE_CHOICES, null=True, blank=True)

    # Auto-generated agency code (AGN-0001, AGN-0002, ...) - for display only
    agency_code = models.CharField(max_length=20, unique=True, editable=False, null=True, blank=True, help_text="Display code like AGN-0001")

    # User who manages this agency
    assign_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="managed_agencies")
    # optional commission account identifier for this agency
    commission_id = models.CharField(max_length=64, null=True, blank=True)

    def save(self, *args, **kwargs):
        # Auto-generate agency_code if not set
        if not self.agency_code:
            self.agency_code = generate_organization_id("agency")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.agency_code})" if self.agency_code else self.name


class AgencyFiles(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="media/agency_files/")
    file_type = models.CharField(max_length=50, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(null=True, blank=True)


class AgencyContact(models.Model):
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    remarks = models.CharField(max_length=50, null=True, blank=True)


class Rule(models.Model):
    """Dynamic rules/terms that can be shown across pages (versioned, multilingual)."""
    RULE_TYPE_CHOICES = [
        ("terms_and_conditions", "Terms and Conditions"),
        ("cancellation_policy", "Cancellation Policy"),
        ("refund_policy", "Refund Policy"),
        ("commission_policy", "Commission Policy"),
        ("transport_policy", "Transport Policy"),
        ("document_policy", "Document Policy"),
        ("hotel_policy", "Hotel Policy"),
        ("visa_policy", "Visa Policy"),
        ("policy", "Policy"),  # Keep for backward compatibility
        ("commission_rule", "Commission Rule"),  # Keep for backward compatibility
    ]

    SUPPORTED_LANGUAGES = [("en", "English"), ("ur", "Urdu")]

    title = models.CharField(max_length=255)
    description = models.TextField()
    rule_type = models.CharField(max_length=100, choices=RULE_TYPE_CHOICES)
    pages_to_display = models.JSONField(default=list)  # e.g. ["booking_page", "agent_portal"]
    is_active = models.BooleanField(default=True)
    language = models.CharField(max_length=10, choices=SUPPORTED_LANGUAGES, default="en")
    version = models.IntegerField(default=1)
    # Store user id for created_by/updated_by to avoid FK issues across DB setups
    created_by = models.IntegerField(null=True, blank=True)
    updated_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} (v{self.version})"

class WalkInBooking(models.Model):
    """Model to store walk-in bookings created by hotel staff.

    Note: room status updates and ledger wiring should be performed in the
    view/service layer within a DB transaction. Helper methods are provided
    for easier integration.
    """

    STATUS_CHECKED_IN = "checked_in"
    STATUS_CHECKED_OUT = "checked_out"
    STATUS_CLEANING_PENDING = "cleaning_pending"
    STATUS_AVAILABLE = "available"

    STATUS_CHOICES = [
        (STATUS_CHECKED_IN, "Checked In"),
        (STATUS_CHECKED_OUT, "Checked Out"),
        (STATUS_CLEANING_PENDING, "Cleaning Pending"),
        (STATUS_AVAILABLE, "Available"),
    ]

    booking_no = models.CharField(max_length=32, unique=True, null=True, blank=True)
    # tickets app defines `Hotels` model (plural) — reference it here
    hotel = models.ForeignKey("tickets.Hotels", on_delete=models.CASCADE)
    organization = models.ForeignKey("Organization", on_delete=models.CASCADE)
    booking_type = models.CharField(max_length=30, default="walk_in")
    customer = models.JSONField(default=dict)  # {name, cnic, phone, address}
    room_details = models.JSONField(default=list)  # list of room items with pricing/dates
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_CHECKED_IN)
    advance_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=20, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    # audit fields (use integer ids to avoid FK migration friction)
    created_by = models.IntegerField(null=True, blank=True)
    updated_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "walkin_bookings"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.booking_no or 'WALKIN'} ({self.hotel_id})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        # Generate booking_no after initial save (so we have pk)
        if is_new and not self.booking_no:
            # Zero-padded id to reduce collisions and be readable
            self.booking_no = f"WALKIN-{self.pk:06d}"
            super().save(update_fields=["booking_no"])

    # Helper placeholders (implement integration in views/services)
    def mark_rooms_occupied(self):
        """Update referenced room records to Occupied.

        room_details expected format: [{"room_id": <id>, ...}, ...]
        Implementation should be done in the transactional service layer.
        """
        # Integrate with tickets.RoomDetails to mark a bed/assignment as taken.
        # This method expects to be called within a transaction to use select_for_update
        from tickets.models import HotelRooms, RoomDetails

        if not isinstance(self.room_details, list):
            return

        for item in self.room_details:
            try:
                room_id = int(item.get("room_id")) if isinstance(item, dict) and item.get("room_id") else None
            except Exception:
                room_id = None
            if not room_id:
                continue

            try:
                room = HotelRooms.objects.select_for_update().get(pk=room_id)
            except HotelRooms.DoesNotExist:
                # skip unknown rooms
                continue

            # Try to find an unassigned RoomDetails (a free bed)
            rd = RoomDetails.objects.filter(room=room, is_assigned=False).first()
            if rd:
                rd.is_assigned = True
                rd.save(update_fields=["is_assigned"])
            else:
                # No unassigned bed found — do not create a new bed because that would
                # allow silent overbooking. Raise an exception so the caller can handle
                # the failure (transaction should roll back).
                raise ValueError(f"No available beds for room id {room_id}")

    def mark_rooms_cleaning_pending(self):
        # For now, mark room details as unassigned (vacated) so room becomes unavailable until cleaned.
        # A more advanced implementation could add a cleaning queue/status on HotelRooms.
        from tickets.models import HotelRooms, RoomDetails

        if not isinstance(self.room_details, list):
            return

        for item in self.room_details:
            try:
                room_id = int(item.get("room_id")) if isinstance(item, dict) and item.get("room_id") else None
            except Exception:
                room_id = None
            if not room_id:
                continue

            try:
                room = HotelRooms.objects.select_for_update().get(pk=room_id)
            except HotelRooms.DoesNotExist:
                continue

            # mark all room details as unassigned (vacated)
            RoomDetails.objects.filter(room=room, is_assigned=True).update(is_assigned=False)

    def mark_rooms_available(self):
        # Mark beds as available (not assigned). Called after cleaning is completed.
        from tickets.models import HotelRooms, RoomDetails

        if not isinstance(self.room_details, list):
            return

        for item in self.room_details:
            try:
                room_id = int(item.get("room_id")) if isinstance(item, dict) and item.get("room_id") else None
            except Exception:
                room_id = None
            if not room_id:
                continue

            try:
                room = HotelRooms.objects.select_for_update().get(pk=room_id)
            except HotelRooms.DoesNotExist:
                continue

            RoomDetails.objects.filter(room=room).update(is_assigned=False)


class OrganizationLink(models.Model):
    """Organization linking between two companies.
    Created by Super Admin only.
    """

    STATUS_PENDING = "PENDING"
    STATUS_ACCEPTED = "ACCEPTED"
    STATUS_REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
    ]

    main_organization = models.ForeignKey(
        "Organization",
        on_delete=models.CASCADE,
        related_name="main_links"
    )
    link_organization = models.ForeignKey(
        "Organization",
        on_delete=models.CASCADE,
        related_name="linked_with"
    )
    link_organization_request = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    main_organization_request = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    request_status = models.BooleanField(default=False)  # false until both accept
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organization_links"
        managed = True

    def save(self, *args, **kwargs):
        # ✅ Auto-set request_status = True when both accepted
        if (
            self.link_organization_request == self.STATUS_ACCEPTED
            and self.main_organization_request == self.STATUS_ACCEPTED
        ):
            self.request_status = True
        else:
            self.request_status = False
        super().save(*args, **kwargs)

    @staticmethod
    def get_linked_organizations(org_id):
        """
        Get all organizations that are linked to the given organization.
        Returns a set of organization IDs that have active links.
        """
        linked_orgs = set()
        
        # Find links where the organization is main_organization and request_status is True
        main_links = OrganizationLink.objects.filter(
            main_organization_id=org_id,
            request_status=True
        ).values_list('link_organization_id', flat=True)
        
        # Find links where the organization is link_organization and request_status is True
        link_links = OrganizationLink.objects.filter(
            link_organization_id=org_id,
            request_status=True
        ).values_list('main_organization_id', flat=True)
        
        linked_orgs.update(main_links)
        linked_orgs.update(link_links)
        
        return linked_orgs

    def __str__(self):
        return f"{self.main_organization} ↔ {self.link_organization} ({self.request_status})"


class ResellRequest(models.Model):
    """A request from a main organization to a linked organization
    asking permission to resell items of a particular type.
    """

    ITEM_HOTEL = "hotel"
    ITEM_TICKET = "ticket"
    ITEM_PACKAGE = "package"

    ITEM_TYPE_CHOICES = [
        (ITEM_HOTEL, "Hotel"),
        (ITEM_TICKET, "Ticket"),
        (ITEM_PACKAGE, "Package"),
    ]

    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    main_organization = models.ForeignKey(
        "Organization",
        on_delete=models.CASCADE,
        related_name="resell_requests_sent",
    )
    link_organization = models.ForeignKey(
        "Organization",
        on_delete=models.CASCADE,
        related_name="resell_requests_received",
    )
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    # List of requested inventory items. Each item is an object like {"type": "hotel", "id": 123}
    items = models.JSONField(default=list, blank=True)
    reseller = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organization_resell_requests"
        ordering = ["-created_at"]

    def approve(self):
        # Mark request as approved and persist that this was approved for reseller
        self.status = self.STATUS_APPROVED
        # When a resell request is approved, it implies reseller permission granted
        try:
            self.reseller = True
        except Exception:
            # Be defensive: if the field doesn't exist for some reason, ignore
            pass
        self.save()

    def reject_and_delete(self):
        # Per requirement: rejection deletes the request
        self.delete()

    def __str__(self):
        return f"ResellRequest({self.main_organization} -> {self.link_organization} : {self.item_type} : {self.status})"
