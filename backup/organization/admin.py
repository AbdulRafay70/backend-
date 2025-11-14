from django.contrib import admin
from .models import OrganizationLink, Branch, Agency, Organization, Employee
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin

# Try to import helper that can create organizations for users (optional)
try:
	from .signals import create_org_for_user
except Exception:
	create_org_for_user = None


# ===== Employee Admin (New Database Table) =====
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
	"""
	Employee management with separate database table.
	Employee → Agency (Branch and Organization are auto-derived)
	"""
	list_display = ('employee_code', 'full_name', 'email', 'agency', 'get_branch', 'get_organization', 'status', 'position')
	list_filter = ('status', 'position', 'agency__branch__organization', 'agency__branch', 'agency')
	search_fields = ('employee_code', 'first_name', 'last_name', 'email', 'phone_number')
	readonly_fields = ('employee_code', 'date_joined', 'created_at', 'updated_at', 'get_branch', 'get_organization')
	
	fieldsets = (
		('Auto-Generated Code', {
			'fields': ('employee_code',),
			'description': 'This code is automatically generated. Format: EMP-0001'
		}),
		('Personal Information', {
			'fields': ('first_name', 'last_name', 'email', 'phone_number', 'address', 'date_of_birth', 'profile_photo')
		}),
		('Employment Details', {
			'fields': ('agency', 'get_branch', 'get_organization', 'position', 'department', 'status', 'date_joined'),
			'description': 'Link employee to Agency only. Branch and Organization are automatically derived from the Agency.'
		}),
		('Compensation', {
			'fields': ('salary', 'commission_rate'),
			'classes': ('collapse',),
		}),
		('Additional Information', {
			'fields': ('notes',),
			'classes': ('collapse',),
		}),
		('Metadata', {
			'fields': ('created_at', 'updated_at', 'created_by'),
			'classes': ('collapse',),
		}),
	)
	
	def get_branch(self, obj):
		"""Display the branch (derived from agency)"""
		if obj.agency and obj.agency.branch:
			return f"{obj.agency.branch.name} ({obj.agency.branch.branch_code})"
		return "N/A"
	get_branch.short_description = "Branch (Auto)"
	
	def get_organization(self, obj):
		"""Display the organization (derived from agency → branch)"""
		if obj.agency and obj.agency.branch and obj.agency.branch.organization:
			org = obj.agency.branch.organization
			return f"{org.name} ({org.org_code})"
		return "N/A"
	get_organization.short_description = "Organization (Auto)"
	
	def save_model(self, request, obj, form, change):
		"""Set created_by on first save"""
		if not change:  # Only on creation
			obj.created_by = request.user
		super().save_model(request, obj, form, change)


# Do NOT register Organization model in the admin - hide the UI completely.
# Organizations are created automatically when a User is added (see signals).
try:
	admin.site.unregister(Organization)
except Exception:
	# If Organization was not registered previously, ignore the error.
	pass
# Customize User admin to show organization info and provide an action
try:
	admin.site.unregister(User)
except Exception:
	pass


class CustomUserAdmin(DefaultUserAdmin):
	"""Extend the default User admin to show linked organization info."""

    
	def get_org_id(self, obj):
		"""Return the first linked organization's numeric id or '-'"""
		org = obj.organizations.order_by('id').first()
		return org.id if org else "-"
	get_org_id.short_description = "Organization ID"

	def get_org_code(self, obj):
		"""Return the first linked organization's org_code or '-'"""
		org = obj.organizations.order_by('id').first()
		return org.org_code if org else "-"
	get_org_code.short_description = "Organization Code"

	def get_org_contacts(self, obj):
		# Show single organization's username/email and contact for clarity
		org = obj.organizations.order_by('id').first()
		if not org:
			return "-"
		# Use org.name as display username (fallback to org_code), show org email if present
		username = org.name or org.org_code
		email = org.email or "-"
		contact = org.phone_number or "-"
		return f"{username} ({email}) {contact}"
	get_org_contacts.short_description = "Organization contacts"

	# Place Organization ID and Organization Code first, then default user fields
	list_display = ("get_org_id", "get_org_code") + DefaultUserAdmin.list_display + ("get_org_contacts",)

	actions = ["ensure_organization"]

	def ensure_organization(self, request, queryset):
		"""Admin action: create Organization for selected users if missing."""
		if create_org_for_user is None:
			self.message_user(request, "Organization creation helper not available.")
			return
		created = 0
		for user in queryset:
			if not user.organizations.exists():
				org = create_org_for_user(user)
				if org:
					created += 1
		self.message_user(request, f"Organizations created: {created}")
	ensure_organization.short_description = "Ensure Organization exists for selected users"


admin.site.register(User, CustomUserAdmin)
# Register OrganizationLink
@admin.register(OrganizationLink)
class OrganizationLinkAdmin(admin.ModelAdmin):
	# Use fields that exist on the OrganizationLink model
	list_display = (
		"main_organization",
		"link_organization",
		"link_organization_request",
		"main_organization_request",
		"request_status",
		"created_at",
	)
	list_filter = ("request_status", "link_organization_request", "main_organization_request")
	search_fields = ("main_organization__name", "link_organization__name")


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
	list_display = ("id", "branch_code", "name", "organization", "contact_number", "email", "get_employee_count", "commission_id")
	search_fields = ("name", "organization__name", "commission_id", "branch_code")
	list_filter = ("organization",)
	readonly_fields = ("branch_code",)
	filter_horizontal = ("user",)  # Keep for admin users, not employees
	fieldsets = (
		("Auto-Generated Code", {
			"fields": ("branch_code",),
			"description": "This code is automatically generated when you save. Format: BRN-0001"
		}),
		("Branch Information", {
			"fields": ("organization", "name", "contact_number", "email", "address")
		}),
		("Admin Users", {
			"fields": ("user",),
			"description": "Link admin users (not employees) to this branch",
			"classes": ("collapse",)
		}),
		("Commission", {
			"fields": ("commission_id",)
		}),
	)
	
	def get_employee_count(self, obj):
		"""Show number of employees through Agency chain"""
		count = 0
		for agency in obj.agencies.all():
			count += agency.employees.count()
		return f"{count} employee(s)"
	get_employee_count.short_description = "Employees"


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
	list_display = ("id", "agency_code", "name", "branch", "phone_number", "email", "agency_type", "get_employee_count", "commission_id")
	search_fields = ("name", "branch__name", "commission_id", "agency_code")
	list_filter = ("branch", "agency_type", "agreement_status")
	readonly_fields = ("agency_code",)
	filter_horizontal = ("user",)  # Keep for admin users, not employees
	fieldsets = (
		("Auto-Generated Code", {
			"fields": ("agency_code",),
			"description": "This code is automatically generated when you save. Format: AGN-0001"
		}),
		("Agency Information", {
			"fields": ("branch", "name", "ageny_name", "phone_number", "email", "address", "logo")
		}),
		("Type & Agreement", {
			"fields": ("agency_type", "agreement_status", "assign_to")
		}),
		("Credit Settings", {
			"fields": ("credit_limit", "credit_limit_days")
		}),
		("Admin Users", {
			"fields": ("user",),
			"description": "Link admin users (not employees) to this agency",
			"classes": ("collapse",)
		}),
		("Commission", {
			"fields": ("commission_id",)
		}),
	)
	
	def get_employee_count(self, obj):
		"""Show number of employees linked to this agency"""
		count = obj.employees.count()
		return f"{count} employee(s)"
	get_employee_count.short_description = "Employees"
