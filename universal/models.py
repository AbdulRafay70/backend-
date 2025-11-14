from django.db import models
from django.utils import timezone

# PaxMovement: tracks passenger entry/exit, flight updates, and status reporting
class PaxMovement(models.Model):
    STATUS_CHOICES = [
        ("in_pakistan", "In Pakistan"),
        ("entered_ksa", "Entered KSA"),
        ("in_ksa", "In KSA"),
        ("exited_ksa", "Exited KSA"),
        ("exit_pending", "Exit Pending"),
    ]
    id = models.AutoField(primary_key=True)
    pax_id = models.CharField(max_length=100, help_text="Linked to booking/passenger")
    flight_no = models.CharField(max_length=50)
    departure_airport = models.CharField(max_length=100)
    arrival_airport = models.CharField(max_length=100)
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="in_pakistan")
    verified_exit = models.BooleanField(default=False)
    agent_id = models.CharField(max_length=100, help_text="Linked agent/organization")
    reported_to_shirka = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pax {self.pax_id} - {self.status} ({self.flight_no})"
from django.db import models
from django.utils import timezone


class UniversalRegistration(models.Model):
    TYPE_ORGANIZATION = "organization"
    TYPE_BRANCH = "branch"
    TYPE_AGENT = "agent"
    TYPE_EMPLOYEE = "employee"

    TYPE_CHOICES = [
        (TYPE_ORGANIZATION, "Organization"),
        (TYPE_BRANCH, "Branch"),
        (TYPE_AGENT, "Agent"),
        (TYPE_EMPLOYEE, "Employee"),
    ]

    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_SUSPENDED = "suspended"
    # Pending is used for newly submitted registrations awaiting admin approval
    STATUS_PENDING = "pending"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_PENDING, "Pending"),
    ]

    id = models.CharField(max_length=32, primary_key=True)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )

    organization_id = models.CharField(max_length=32, null=True, blank=True)
    branch_id = models.CharField(max_length=32, null=True, blank=True)

    name = models.CharField(max_length=255)
    owner_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)
    contact_no = models.CharField(max_length=32, null=True, blank=True)
    cnic = models.CharField(max_length=32, null=True, blank=True)
    cnic_front = models.ImageField(upload_to='universal/cnic/', null=True, blank=True, help_text="CNIC Front Image")
    cnic_back = models.ImageField(upload_to='universal/cnic/', null=True, blank=True, help_text="CNIC Back Image")
    visiting_card = models.ImageField(upload_to='universal/visiting_cards/', null=True, blank=True, help_text="Visiting Card Image")
    dts_license = models.CharField(max_length=1024, null=True, blank=True)
    license_no = models.CharField(max_length=128, null=True, blank=True)
    ntn_no = models.CharField(max_length=128, null=True, blank=True)

    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=128, null=True, blank=True)
    country = models.CharField(max_length=64, default="Pakistan")

    created_by = models.CharField(max_length=64, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "universal_registration"
        indexes = [
            models.Index(fields=["type"]),
            models.Index(fields=["organization_id"]),
            models.Index(fields=["branch_id"]),
        ]

    def __str__(self):
        return f"{self.type}:{self.id} - {self.name}"

    # -- Business helpers --

    def get_descendants(self):
        """Return a queryset/list of all descendants (children, grandchildren, ...) of this registration."""
        descendants = []
        queue = list(self.children.all())
        while queue:
            node = queue.pop(0)
            descendants.append(node)
            queue.extend(list(node.children.all()))
        return descendants

    def deactivate_with_cascade(self, performed_by: str = None):
        """Soft-deactivate this record and cascade to descendants.

        This marks `is_active=False` and `status=inactive` for this record and all children.
        AuditLog entries will be created via signals attached to saves.
        """
        # Deactivate current
        self.is_active = False
        self.status = UniversalRegistration.STATUS_INACTIVE
        self.save()

        # Deactivate descendants
        for child in self.get_descendants():
            child.is_active = False
            child.status = UniversalRegistration.STATUS_INACTIVE
            child.save()


class UniversalIDSequence(models.Model):
    """Simple sequence table to generate atomic, incrementing IDs per entity type.

    Fields:
        type_key: string key (organization, branch, agent, employee)
        last_value: last integer value used for this type
    """

    type_key = models.CharField(max_length=32, unique=True)
    last_value = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "universal_id_sequence"

    def __str__(self):
        return f"{self.type_key}:{self.last_value}"


class AuditLog(models.Model):
    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"

    ACTION_CHOICES = [
        (ACTION_CREATE, "Create"),
        (ACTION_UPDATE, "Update"),
        (ACTION_DELETE, "Delete"),
    ]

    action = models.CharField(max_length=16, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=128)
    object_id = models.CharField(max_length=64)
    performed_by = models.CharField(max_length=128, null=True, blank=True)
    previous_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_log"

    def __str__(self):
        return f"{self.action} - {self.model_name}:{self.object_id} @ {self.timestamp}"


# RegistrationRule: dynamic requirements/benefits table for registration types
class RegistrationRule(models.Model):
    TYPE_CHOICES = [
        ("organization", "Organization"),
        ("branch", "Branch"),
        ("agent", "Agent"),
        ("employee", "Employee"),
    ]
    id = models.AutoField(primary_key=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    requirement_text = models.TextField()
    benefit_text = models.TextField()
    city_needed = models.CharField(max_length=100, blank=True, null=True, help_text="Required only for branch (optional)")
    service_allowed = models.CharField(max_length=200, blank=True, null=True, help_text="Allowed services (for agent, optional)")
    post_available = models.CharField(max_length=200, blank=True, null=True, help_text="Post options (for employee, optional)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.type}: {self.requirement_text[:30]}..."
