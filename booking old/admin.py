from django.contrib import admin
from django import forms
from django.db.models import Count, Q
from .models import (
	Booking,
	Discount,
	DiscountGroup,
	Markup,
	BankAccount,
	AllowedReseller,
	BookingHotelDetails,
	BookingPersonDetail,
	BookingTicketDetails,
	HotelOutsourcing,
	BookingItem,
	BookingPax,
	BookingStatusTimeline,
	BookingPromotion,
	BookingPayment,
	Payment,
)
from organization.models import Employee


class BookingItemInlineForm(forms.ModelForm):
	"""Custom form for BookingItem to make item_name readonly and auto-populate unit_price"""
	
	class Meta:
		model = BookingItem
		fields = '__all__'
	
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		
		# Make item_name readonly (it will be auto-filled from selection)
		if 'item_name' in self.fields:
			self.fields['item_name'].widget.attrs['readonly'] = True
			self.fields['item_name'].widget.attrs['placeholder'] = 'Auto-filled from selection'
			self.fields['item_name'].required = False
		
		# Add placeholder for unit_price (will auto-fill from DB, but user can override)
		if 'unit_price' in self.fields:
			self.fields['unit_price'].widget.attrs['placeholder'] = 'Auto-filled from selected item (editable)'
			self.fields['unit_price'].help_text = 'Will auto-populate from selected inventory item'


class BookingForm(forms.ModelForm):
	"""Custom form to show employees with full details"""
	employee = forms.ModelChoiceField(
		queryset=Employee.objects.select_related('agency', 'agency__branch', 'agency__branch__organization').all(),
		required=True,
		label="Employee",
		help_text="Select employee - Organization, Branch, and Agency will be filled automatically"
	)

	class Meta:
		model = Booking
		fields = '__all__'
		exclude = ['user']  # user will be set from employee

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		# If editing existing booking, set employee from user
		if self.instance.pk and self.instance.user and hasattr(self.instance.user, 'employee_profile'):
			self.fields['employee'].initial = self.instance.user.employee_profile
		
		# Remove user field from the form (will be set automatically from employee)
		if 'user' in self.fields:
			del self.fields['user']
		
		# Make organization, branch, and agency READ-ONLY (disabled)
		for field in ['organization', 'branch', 'agency']:
			if field in self.fields:
				self.fields[field].required = False
				self.fields[field].disabled = True
				self.fields[field].widget.attrs.update({
					'style': 'background-color: #f0f0f0; cursor: not-allowed;',
					'readonly': 'readonly'
				})
		
		# Customize employee dropdown label - SIMPLE: Just name and code
		self.fields['employee'].label_from_instance = lambda obj: f"{obj.employee_code} - {obj.full_name}"
		
		# Filter employee queryset to only show employees with user accounts
		self.fields['employee'].queryset = Employee.objects.filter(
			user__isnull=False
		).select_related('user', 'agency', 'agency__branch', 'agency__branch__organization')
		
		# Hide selling/owner organization IDs
		for field in ['selling_organization_id', 'owner_organization_id']:
			if field in self.fields:
				self.fields[field].widget = forms.HiddenInput()
				self.fields[field].required = False
		
		# Hide total_pax, total_adult, total_infant, total_child (will be calculated automatically)
		for field in ['total_pax', 'total_adult', 'total_infant', 'total_child']:
			if field in self.fields:
				self.fields[field].widget = forms.HiddenInput()
				self.fields[field].required = False

	def clean(self):
		cleaned_data = super().clean()
		employee = cleaned_data.get('employee')
		
		if not employee:
			raise forms.ValidationError({
				'employee': "Please select an employee for this booking."
			})
		
		# Set user from employee
		if not employee.user:
			raise forms.ValidationError({
				'employee': "Selected employee must have a linked user account."
			})
		
		cleaned_data['user'] = employee.user
		
		# Set organization, branch, and agency from employee
		if not employee.agency:
			raise forms.ValidationError({
				'employee': "Selected employee must be linked to an agency."
			})
		
		cleaned_data['agency'] = employee.agency
		
		if employee.agency.branch:
			cleaned_data['branch'] = employee.agency.branch
			if employee.agency.branch.organization:
				cleaned_data['organization'] = employee.agency.branch.organization
		else:
			raise forms.ValidationError({
				'employee': "Selected employee's agency must be linked to a branch."
			})
		
		return cleaned_data
	
	def save(self, commit=True):
		instance = super().save(commit=False)
		
		# Set user from employee (critical for new bookings)
		employee = self.cleaned_data.get('employee')
		if employee and employee.user:
			instance.user = employee.user
		
		# Calculate passenger counts from person_details if editing
		if instance.pk:
			instance.total_pax = instance.person_details.count()
			instance.total_adult = instance.person_details.filter(age_group='Adult').count()
			instance.total_child = instance.person_details.filter(age_group='Child').count()
			instance.total_infant = instance.person_details.filter(age_group='Infant').count()
		
		if commit:
			instance.save()
			# Update counts again after save to catch any inline changes
			if instance.pk:
				instance.total_pax = instance.person_details.count()
				instance.total_adult = instance.person_details.filter(age_group='Adult').count()
				instance.total_child = instance.person_details.filter(age_group='Child').count()
				instance.total_infant = instance.person_details.filter(age_group='Infant').count()
				instance.save(update_fields=['total_pax', 'total_adult', 'total_child', 'total_infant'])
		
		return instance


class BookingPersonDetailInline(admin.TabularInline):
	model = BookingPersonDetail
	extra = 1
	fields = (
		'first_name', 'last_name', 'age_group', 'ticket', 'get_ticket_price', 'ticket_price', 'contact_number', 'passport_number',
	)
	readonly_fields = ('get_ticket_price',)
	verbose_name = "Passenger Detail"
	verbose_name_plural = "Passenger Details (Add passengers and select tickets)"
	autocomplete_fields = ['ticket']
	
	def get_ticket_price(self, obj):
		"""Display ticket price from selected ticket"""
		if obj and obj.ticket:
			# Get price based on age group
			if obj.age_group == 'Adult':
				price = obj.ticket.adult_fare
			elif obj.age_group == 'Child':
				price = obj.ticket.child_fare
			elif obj.age_group == 'Infant':
				price = obj.ticket.infant_fare
			else:
				price = obj.ticket.adult_fare
			
			from django.utils.html import format_html
			return format_html(
				'<span style="color: green; font-weight: bold;">PKR {:,.2f}</span>',
				price
			)
		return '-'
	get_ticket_price.short_description = 'Ticket Price'
	
	def get_formset(self, request, obj=None, **kwargs):
		formset = super().get_formset(request, obj, **kwargs)
		# Customize age_group field to show choices
		if 'age_group' in formset.form.base_fields:
			formset.form.base_fields['age_group'] = forms.ChoiceField(
				choices=[
					('', '--- Select Age Group ---'),
					('Adult', 'Adult'),
					('Child', 'Child'),
					('Infant', 'Infant'),
				],
				required=True,
				help_text="Select passenger age group"
			)
		return formset


class BookingItemInline(admin.TabularInline):
	"""Inline for adding hotels, transport, packages, visas, etc. to booking"""
	model = BookingItem
	form = BookingItemInlineForm
	extra = 1
	fields = (
		'inventory_type', 'hotel', 'transport', 'package', 'visa', 'ticket',
		'item_name', 'description', 'unit_price', 'quantity', 'discount_amount', 'final_amount',
		'item_details'
	)
	readonly_fields = ('final_amount',)
	verbose_name = "Booking Item (Hotel/Transport/Package/Visa)"
	verbose_name_plural = "Booking Items - Add Hotels, Transport, Packages, Visas, etc."
	autocomplete_fields = ['hotel', 'package', 'visa', 'ticket']
	
	class Media:
		css = {
			'all': ('admin/css/booking_item_inline.css',)
		}
		js = (
			'admin/js/booking_item_inline.js',
			'admin/js/booking_item_dynamic_fields.js',  # Dynamic show/hide fields
		)
	
	def get_formset(self, request, obj=None, **kwargs):
		formset = super().get_formset(request, obj, **kwargs)
		
		# Add help text for inventory_type
		if 'inventory_type' in formset.form.base_fields:
			formset.form.base_fields['inventory_type'].help_text = (
				'Select type - only relevant dropdown will appear'
			)
		
		# Add help text for item_details
		if 'item_details' in formset.form.base_fields:
			formset.form.base_fields['item_details'].help_text = (
				'Add JSON details like: {"room_type": "double", "check_in": "2025-12-01", '
				'"check_out": "2025-12-05", "pickup_point": "Airport", "vehicle_type": "Coaster"}'
			)
		
		# Make item_name optional - can be auto-filled from selection
		if 'item_name' in formset.form.base_fields:
			formset.form.base_fields['item_name'].required = False
			formset.form.base_fields['item_name'].help_text = (
				'Leave blank to auto-fill from selected hotel/transport/visa/package/ticket.'
			)
		
		return formset


class BookingPaxInline(admin.TabularInline):
	"""Inline for managing passenger (PAX) details with visa assignment"""
	model = BookingPax
	extra = 1
	fields = (
		'pax_id', 'first_name', 'last_name', 'passport_no', 'pax_type', 
		'visa', 'phone', 'email'
	)
	readonly_fields = ('pax_id',)
	verbose_name = "PAX Detail (Passenger with Visa)"
	verbose_name_plural = "PAX Details - Passenger Management with Visa Assignment"
	autocomplete_fields = ['visa']


class BookingStatusTimelineInline(admin.TabularInline):
	"""Inline for viewing booking status history"""
	model = BookingStatusTimeline
	extra = 0
	fields = ('status', 'timestamp', 'changed_by', 'notes')
	readonly_fields = ('timestamp',)
	verbose_name = "Status Change"
	verbose_name_plural = "Status Timeline / History"
	can_delete = False
	
	def has_add_permission(self, request, obj=None):
		# Status changes should be added automatically
		return False


class BookingPromotionInline(admin.TabularInline):
	"""Inline for applying promotions and discounts"""
	model = BookingPromotion
	extra = 1
	fields = (
		'promotion_name', 'promotion_code', 'discount_type', 'discount_value',
		'discount_amount', 'applies_to', 'is_active'
	)
	verbose_name = "Promotion/Discount"
	verbose_name_plural = "Applied Promotions & Discounts"


class BookingPaymentInline(admin.TabularInline):
	"""Inline for managing payment records"""
	model = BookingPayment
	extra = 1
	fields = (
		'amount', 'payment_method', 'status', 'transaction_id', 
		'reference_no', 'payment_date', 'notes'
	)
	readonly_fields = ('payment_date',)
	verbose_name = "Payment Record"
	verbose_name_plural = "Payment Records - Track Multiple Payments"
	
	def get_formset(self, request, obj=None, **kwargs):
		formset = super().get_formset(request, obj, **kwargs)
		
		# Add help text for status field
		if 'status' in formset.form.base_fields:
			formset.form.base_fields['status'].help_text = (
				'⚠️ Set to "Completed" to count towards paid amount. '
				'Pending payments do not reduce the pending balance.'
			)
		
		return formset


class BookingAdmin(admin.ModelAdmin):
	form = BookingForm
	list_display = (
		'booking_number', 'invoice_no', 'customer_name', 'get_employee', 'get_organization', 
		'get_branch', 'status', 'payment_status', 'total_amount', 'paid_payment', 
		'pending_payment', 'created_at'
	)
	search_fields = (
		'booking_number', 'invoice_no', 'customer_name', 'customer_contact', 
		'person_details__first_name', 'person_details__passport_number', 
		'user__employee_profile__first_name', 'user__employee_profile__last_name'
	)
	list_filter = ('status', 'payment_status', 'is_public_booking', 'organization', 'branch', 'agency', 'created_at')
	
	# Streamlined inlines - Remove duplicate passenger section
	inlines = [
		BookingItemInline,           # Hotels, Transport, Packages, Visas, etc.
		BookingPaxInline,             # Passenger details with visa assignment (PRIMARY)
		BookingPromotionInline,       # Discounts and promotions
		BookingPaymentInline,         # Payment records
		BookingStatusTimelineInline,  # Status history (read-only)
	]
	
	readonly_fields = ('booking_number', 'invoice_no', 'get_passenger_summary', 'get_amounts_summary', 'total_amount', 'paid_payment', 'pending_payment', 'get_ledger_link')
	actions = ['admin_confirm_booking', 'admin_cancel_booking', 'admin_verify_payment']
	
	fieldsets = (
		('Employee & Organization Info', {
			'fields': ('employee', 'organization', 'branch', 'agency'),
			'description': '<strong>Select employee.</strong> Organization, Branch, and Agency will be auto-filled.'
		}),
		('Customer Information', {
			'fields': ('customer_name', 'customer_contact', 'customer_email', 'customer_address'),
			'description': 'Enter customer/client details for the booking.'
		}),
		('Booking Information', {
			'fields': ('booking_number', 'invoice_no', 'status', 'payment_status', 'get_ledger_link', 'expiry_time'),
			'description': 'Ledger entry is auto-created when payment status is set to "Paid".'
		}),
		('Amount Details', {
			'fields': ('get_amounts_summary',),
			'description': '<strong>Booking financial summary based on booking items added.</strong> Amounts are calculated automatically from booking items × quantity. Paid amount comes from completed payment records.'
		}),
		('Passenger Summary', {
			'fields': ('get_passenger_summary',),
			'description': 'Passenger counts are calculated automatically from PAX details below.'
		}),
		('Additional Details', {
			'fields': ('confirmed_by', 'rejected_employer', 'internals', 'client_note'),
			'classes': ('collapse',),
		}),
	)
	
	def save_model(self, request, obj, form, change):
		"""Save the booking and update passenger counts"""
		# Calculate pending_payment before saving
		obj.pending_payment = (obj.total_amount or 0) - (obj.paid_payment or 0)
		
		super().save_model(request, obj, form, change)
		
		# Update passenger counts from booking_pax (new PAX system)
		if obj.pk:
			pax_count = obj.booking_pax.count()
			if pax_count > 0:
				obj.total_pax = pax_count
				obj.total_adult = obj.booking_pax.filter(pax_type='adult').count()
				obj.total_child = obj.booking_pax.filter(pax_type='child').count()
				obj.total_infant = obj.booking_pax.filter(pax_type='infant').count()
			else:
				# Fallback to old person_details if no PAX
				obj.total_pax = obj.person_details.count()
				obj.total_adult = obj.person_details.filter(age_group='Adult').count()
				obj.total_child = obj.person_details.filter(age_group='Child').count()
				obj.total_infant = obj.person_details.filter(age_group='Infant').count()
			
			obj.save(update_fields=['total_pax', 'total_adult', 'total_child', 'total_infant'])
	
	def save_formset(self, request, form, formset, change):
		"""After saving formsets, update related data"""
		from django.db.models import Sum
		from decimal import Decimal
		
		instances = formset.save(commit=False)
		
		for instance in instances:
			# For BookingPax - ensure pax_id is generated
			if hasattr(instance, 'pax_id'):
				instance.save()
			# For BookingItem - ensure final_amount is calculated
			elif hasattr(instance, 'final_amount') and hasattr(instance, 'inventory_type'):
				instance.save()
			# For BookingPayment - track created_by
			elif hasattr(instance, 'payment_method'):
				if not instance.pk and not instance.created_by:
					instance.created_by = request.user
				instance.save()
			else:
				instance.save()
		
		# Delete instances marked for deletion
		for instance in formset.deleted_objects:
			instance.delete()
		
		# Update passenger counts and booking totals after saving
		if change and form.instance.pk:
			booking = form.instance
			
			# Update passenger counts from booking_pax
			pax_count = booking.booking_pax.count()
			if pax_count > 0:
				booking.total_pax = pax_count
				booking.total_adult = booking.booking_pax.filter(pax_type='adult').count()
				booking.total_child = booking.booking_pax.filter(pax_type='child').count()
				booking.total_infant = booking.booking_pax.filter(pax_type='infant').count()
			
			# Update amounts from booking_items - ensure all are Decimal
			if booking.booking_items.exists():
				booking.total_ticket_amount = booking.booking_items.filter(
					inventory_type='ticket').aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
				booking.total_hotel_amount = booking.booking_items.filter(
					inventory_type='hotel').aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
				booking.total_transport_amount = booking.booking_items.filter(
					inventory_type='transport').aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
				booking.total_visa_amount = booking.booking_items.filter(
					inventory_type='visa').aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
				
				# Calculate total amount - all values are now Decimal
				booking.total_amount = (
					booking.total_ticket_amount +
					booking.total_hotel_amount +
					booking.total_transport_amount +
					booking.total_visa_amount
				)
			
			# Update paid_payment from completed payment records - ensure Decimal
			booking.paid_payment = booking.payment_records.filter(
				status='completed').aggregate(total=Sum('amount'))['total'] or Decimal('0')
			
			# Update pending payment - ensure Decimal
			booking.pending_payment = Decimal(str(booking.total_amount or 0)) - Decimal(str(booking.paid_payment or 0))
			
			# Save all updates
			booking.save(update_fields=[
				'total_pax', 'total_adult', 'total_child', 'total_infant',
				'total_ticket_amount', 'total_hotel_amount', 'total_transport_amount', 'total_visa_amount',
				'total_amount', 'paid_payment', 'pending_payment'
			])
		if form.instance.pk:
			obj = form.instance
			obj.total_pax = obj.person_details.count()
			obj.total_adult = obj.person_details.filter(age_group='Adult').count()
			obj.total_child = obj.person_details.filter(age_group='Child').count()
			obj.total_infant = obj.person_details.filter(age_group='Infant').count()
			
			# Calculate total ticket amount from all passengers - ensure Decimal
			from django.db.models import Sum
			ticket_sum = obj.person_details.aggregate(total=Sum('ticket_price'))['total'] or Decimal('0')
			obj.total_ticket_amount = ticket_sum
			
			# Calculate total_amount (ticket + hotel + transport + visa) - ensure all Decimal
			obj.total_amount = (
				Decimal(str(obj.total_ticket_amount or 0)) +
				Decimal(str(obj.total_hotel_amount or 0)) +
				Decimal(str(obj.total_transport_amount or 0)) +
				Decimal(str(obj.total_visa_amount or 0))
			)
			
			# Calculate pending_payment - ensure Decimal
			obj.pending_payment = Decimal(str(obj.total_amount or 0)) - Decimal(str(obj.paid_payment or 0))
			
			obj.save(update_fields=[
				'total_pax', 'total_adult', 'total_child', 'total_infant',
				'total_ticket_amount', 'total_amount', 'pending_payment'
			])
	
	def get_employee(self, obj):
		"""Display employee name"""
		if hasattr(obj.user, 'employee_profile'):
			emp = obj.user.employee_profile
			return f"{emp.full_name} ({emp.employee_code})"
		return obj.user.username if obj.user else "N/A"
	get_employee.short_description = "Employee"
	
	def get_organization(self, obj):
		"""Display organization"""
		return obj.organization.name if obj.organization else "N/A"
	get_organization.short_description = "Organization"
	
	def get_branch(self, obj):
		"""Display branch"""
		return obj.branch.name if obj.branch else "N/A"
	get_branch.short_description = "Branch"
	
	def get_display_organization(self, obj):
		"""Display organization for form (read-only)"""
		if obj and obj.organization:
			return f"{obj.organization.name} ({obj.organization.org_code})"
		return "Select employee first"
	get_display_organization.short_description = "Organization"
	
	def get_display_branch(self, obj):
		"""Display branch for form (read-only)"""
		if obj and obj.branch:
			return f"{obj.branch.name} ({obj.branch.branch_code})"
		return "Select employee first"
	get_display_branch.short_description = "Branch"
	
	def get_display_agency(self, obj):
		"""Display agency for form (read-only)"""
		if obj and obj.agency:
			return f"{obj.agency.name} ({obj.agency.agency_code})"
		return "Select employee first"
	get_display_agency.short_description = "Agency"
	
	def get_ledger_link(self, obj):
		"""Display ledger entry link if it exists"""
		from django.utils.html import format_html
		from django.urls import reverse
		
		if not obj or not obj.pk:
			return format_html("<em>Save booking first</em>")
		
		if obj.ledger_entry:
			# Create a link to the ledger entry in admin
			ledger_url = reverse('admin:ledger_ledgerentry_change', args=[obj.ledger_entry.id])
			return format_html(
				'<a href="{}" target="_blank" style="color: #28a745; font-weight: bold;">📋 Ledger Entry #{}</a> '
				'<span style="color: #666;">(Created: {})</span>',
				ledger_url,
				obj.ledger_entry.id,
				obj.ledger_entry.created_at.strftime('%Y-%m-%d %H:%M')
			)
		elif obj.payment_status == 'Paid':
			return format_html(
				'<span style="color: #d9534f;">⚠️ No ledger entry - Click Save to create</span>'
			)
		else:
			return format_html(
				'<span style="color: #666;">Will be created when payment status is "Paid"</span>'
			)
	get_ledger_link.short_description = "Ledger Entry"
	
	def get_total_pax(self, obj):
		"""Calculate total passengers from person_details"""
		return obj.person_details.count()
	get_total_pax.short_description = "Total Pax"
	
	def get_passenger_summary(self, obj):
		"""Display passenger summary with counts by age group"""
		from django.utils.html import format_html
		
		if not obj.pk:
			return format_html("<em>Save booking first to see passenger summary</em>")
		
		# Use new booking_pax system if available, fallback to old person_details
		if hasattr(obj, 'booking_pax') and obj.booking_pax.exists():
			total = obj.booking_pax.count()
			adults = obj.booking_pax.filter(pax_type='adult').count()
			children = obj.booking_pax.filter(pax_type='child').count()
			infants = obj.booking_pax.filter(pax_type='infant').count()
			source = "PAX System"
		else:
			total = obj.person_details.count()
			adults = obj.person_details.filter(age_group='Adult').count()
			children = obj.person_details.filter(age_group='Child').count()
			infants = obj.person_details.filter(age_group='Infant').count()
			source = "Legacy System"
		
		html = f"""
		<div style="padding: 10px; background: #f8f9fa; border-radius: 5px;">
			<h3 style="margin-top: 0;">Passenger Summary <small style="color: #666;">({source})</small></h3>
			<table style="width: 100%; border-collapse: collapse;">
				<tr style="background: #e9ecef;">
					<th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Category</th>
					<th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Count</th>
				</tr>
				<tr>
					<td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Total Passengers</strong></td>
					<td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; background: #d1ecf1;"><strong>{total}</strong></td>
				</tr>
				<tr>
					<td style="padding: 8px; border: 1px solid #dee2e6;">Adults</td>
					<td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">{adults}</td>
				</tr>
				<tr>
					<td style="padding: 8px; border: 1px solid #dee2e6;">Children</td>
					<td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">{children}</td>
				</tr>
				<tr>
					<td style="padding: 8px; border: 1px solid #dee2e6;">Infants</td>
					<td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">{infants}</td>
				</tr>
			</table>
		</div>
		"""
		return format_html(html)
	get_passenger_summary.short_description = "Passenger Summary"
	
	def get_amounts_summary(self, obj):
		"""Display amounts summary calculated from booking items"""
		from django.utils.html import format_html
		from django.db.models import Sum
		
		if not obj.pk:
			return format_html("<em>Save booking first to see amounts</em>")
		
		# Calculate amounts from booking_items if available
		if hasattr(obj, 'booking_items') and obj.booking_items.exists():
			# Calculate by inventory type
			ticket_amount = obj.booking_items.filter(inventory_type='ticket').aggregate(
				total=Sum('final_amount'))['total'] or 0
			hotel_amount = obj.booking_items.filter(inventory_type='hotel').aggregate(
				total=Sum('final_amount'))['total'] or 0
			transport_amount = obj.booking_items.filter(inventory_type='transport').aggregate(
				total=Sum('final_amount'))['total'] or 0
			visa_amount = obj.booking_items.filter(inventory_type='visa').aggregate(
				total=Sum('final_amount'))['total'] or 0
			
			total_amount = ticket_amount + hotel_amount + transport_amount + visa_amount
			source = "Booking Items (New System)"
		else:
			# Fallback to stored values
			ticket_amount = obj.total_ticket_amount or 0
			hotel_amount = obj.total_hotel_amount or 0
			transport_amount = obj.total_transport_amount or 0
			visa_amount = obj.total_visa_amount or 0
			total_amount = obj.total_amount or 0
			source = "Stored Values (Legacy)"
		
		# Get paid amount from completed payment records
		paid_amount = obj.payment_records.filter(status='completed').aggregate(
			total=Sum('amount'))['total'] or 0
		pending_amount = total_amount - paid_amount
		
		html = f"""
		<div style="padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #28a745;">
			<h3 style="margin-top: 0; color: #28a745;">💰 Booking Amounts Summary <small style="color: #666;">({source})</small></h3>
			<table style="width: 100%; border-collapse: collapse;">
				<tr style="background: #e9ecef;">
					<th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Description</th>
					<th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Amount (PKR)</th>
				</tr>
				<tr>
					<td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Total Ticket Amount</strong></td>
					<td style="padding: 10px; text-align: right; border: 1px solid #dee2e6; background: #cfe2ff;"><strong>{ticket_amount:,.2f}</strong></td>
				</tr>
				<tr>
					<td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Total Hotel Amount</strong></td>
					<td style="padding: 10px; text-align: right; border: 1px solid #dee2e6; background: #f8d7da;"><strong>{hotel_amount:,.2f}</strong></td>
				</tr>
				<tr>
					<td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Total Transport Amount</strong></td>
					<td style="padding: 10px; text-align: right; border: 1px solid #dee2e6; background: #fff3cd;"><strong>{transport_amount:,.2f}</strong></td>
				</tr>
				<tr>
					<td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Total Visa Amount</strong></td>
					<td style="padding: 10px; text-align: right; border: 1px solid #dee2e6; background: #d1ecf1;"><strong>{visa_amount:,.2f}</strong></td>
				</tr>
				<tr style="background: #d4edda; font-size: 16px;">
					<td style="padding: 12px; border: 1px solid #dee2e6;"><strong>TOTAL AMOUNT</strong></td>
					<td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;"><strong>{total_amount:,.2f}</strong></td>
				</tr>
				<tr>
					<td style="padding: 10px; border: 1px solid #dee2e6;"><em>Paid Payment (from completed payment records)</em></td>
					<td style="padding: 10px; text-align: right; border: 1px solid #dee2e6; background: #d1f4d1;">{paid_amount:,.2f}</td>
				</tr>
				<tr style="background: {'#f8d7da' if pending_amount > 0 else '#d1f4d1'};">
					<td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Pending Payment</strong></td>
					<td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;"><strong>{pending_amount:,.2f}</strong></td>
				</tr>
			</table>
			<p style="margin-top: 15px; color: #666; font-size: 12px;">
				<strong>Note:</strong> Total amount is calculated from booking items below. 
				<strong style="color: #d9534f;">⚠️ Paid amount counts ONLY "Completed" payment records - change payment status to "Completed" to reduce pending balance.</strong>
			</p>
		</div>
		"""
		return format_html(html)
	get_amounts_summary.short_description = "Amounts Summary"
	
	def get_pending_payment(self, obj):
		"""Calculate and display pending payment"""
		from django.utils.html import format_html
		
		if not obj.pk:
			return format_html("<em>Save booking first</em>")
		
		total = obj.total_amount or 0
		paid = obj.paid_payment or 0
		pending = total - paid
		
		color = 'red' if pending > 0 else 'green'
		return format_html(
			'<span style="color: {}; font-weight: bold; font-size: 14px;">PKR {:,.2f}</span>',
			color, pending
		)
	get_pending_payment.short_description = "Pending Payment (Due)"
	
	class Media:
		js = (
			'admin/js/booking_employee_auto_fill.js',
			'admin/js/booking_ticket_price_auto_fill.js',
		)


	def admin_confirm_booking(self, request, queryset):
		"""Admin action to confirm selected bookings and update package confirmed seats."""
		from django.db import transaction
		from django.contrib import messages

		updated = 0
		for booking in queryset.select_related('umrah_package'):
			try:
				prev_status = getattr(booking, 'status', None)
				booking.status = 'confirmed'
				booking.save(update_fields=['status'])

				pkg = getattr(booking, 'umrah_package', None)
				if pkg:
					pkg.confirmed_seats = (pkg.confirmed_seats or 0) + (booking.total_pax or 0)
					pkg.save(update_fields=['confirmed_seats'])

				# notify
				try:
					def _notify():
						try:
							from notifications import services as _ns
							_ns.enqueue_booking_confirmed(booking.id)
						except Exception:
							pass
					transaction.on_commit(_notify)
				except Exception:
					pass

				updated += 1
			except Exception:
				continue

		self.message_user(request, f"Confirmed {updated} booking(s).", level=messages.INFO)

	admin_confirm_booking.short_description = "Confirm selected public bookings"

	def admin_cancel_booking(self, request, queryset):
		"""Admin action to cancel selected bookings and release package seats."""
		from django.db import transaction
		from django.contrib import messages

		updated = 0
		for booking in queryset.select_related('umrah_package'):
			try:
				prev_status = getattr(booking, 'status', None)
				booking.status = 'canceled'
				booking.save(update_fields=['status'])

				pkg = getattr(booking, 'umrah_package', None)
				if pkg:
					pkg.left_seats = (pkg.left_seats or 0) + (booking.total_pax or 0)
					pkg.booked_seats = max(0, (pkg.booked_seats or 0) - (booking.total_pax or 0))
					if str(prev_status).lower() == 'confirmed':
						pkg.confirmed_seats = max(0, (pkg.confirmed_seats or 0) - (booking.total_pax or 0))
					pkg.save(update_fields=['left_seats', 'booked_seats', 'confirmed_seats'])

				try:
					def _notify():
						try:
							from notifications import services as _ns
							_ns.enqueue_booking_canceled(booking.id)
						except Exception:
							pass
					transaction.on_commit(_notify)
				except Exception:
					pass

				updated += 1
			except Exception:
				continue

		self.message_user(request, f"Canceled {updated} booking(s).", level=messages.INFO)

	admin_cancel_booking.short_description = "Cancel selected public bookings"

	def admin_verify_payment(self, request, queryset):
		"""Admin action to verify the latest pending public payment for selected bookings."""
		from django.db import transaction
		from decimal import Decimal
		from django.contrib import messages

		updated = 0
		for booking in queryset.prefetch_related('payment_details'):
			try:
				payment = booking.payment_details.filter(public_mode=True, status='Pending').order_by('-id').first()
				if not payment:
					continue

				with transaction.atomic():
					payment.status = 'Completed'
					payment.save(update_fields=['status'])

					try:
						prev = Decimal(str(booking.total_payment_received or 0))
					except Exception:
						prev = Decimal('0')
					try:
						amt = Decimal(str(payment.amount or 0))
					except Exception:
						amt = Decimal('0')

					booking.total_payment_received = prev + amt
					try:
						paid = float(booking.total_payment_received or 0)
						total = float(booking.total_amount or 0)
						booking.paid_payment = paid
						booking.pending_payment = max(0.0, total - paid)
						if paid >= total and total > 0:
							booking.is_paid = True
							booking.status = 'confirmed'
						booking.save(update_fields=['total_payment_received', 'paid_payment', 'pending_payment', 'is_paid', 'status'])
					except Exception:
						booking.save()

					# update follow-ups
					try:
						remaining = float(booking.total_amount or 0) - float(booking.total_payment_received or 0)
					except Exception:
						remaining = None

					if remaining is not None:
						open_fus = booking.followups.filter(status__in=['open', 'pending']).order_by('created_at')
						if remaining <= 0:
							for fu in open_fus:
								try:
									fu.remaining_amount = 0
									fu.close(user=request.user if hasattr(request, 'user') else None)
								except Exception:
									fu.remaining_amount = 0
									fu.status = 'closed'
									fu.closed_at = __import__('datetime').datetime.now()
									fu.save()
						else:
							fu = open_fus.first()
							if fu:
								fu.remaining_amount = remaining
								fu.save()

				# notify
				try:
					def _notify():
						try:
							from notifications import services as _ns
							_ns.enqueue_public_payment_approved(payment.id)
						except Exception:
							pass
					transaction.on_commit(_notify)
				except Exception:
					pass

				updated += 1
			except Exception:
				continue

		self.message_user(request, f"Verified payments for {updated} booking(s).", level=messages.INFO)

	admin_verify_payment.short_description = "Verify latest pending public payment for selected bookings"


class BookingPersonDetailAdmin(admin.ModelAdmin):
	list_display = ('booking', 'first_name', 'last_name', 'passport_number', 'contact_number', 'age_group', 'ticket_price')
	search_fields = ('first_name', 'last_name', 'passport_number', 'contact_number')
	list_filter = ('age_group',)


class HotelOutsourcingAdmin(admin.ModelAdmin):
	list_display = ("booking", "hotel_name", "is_paid", "agent_notified", "created_at")
	search_fields = ("booking__booking_number", "hotel_name")
	list_filter = ("is_paid", "agent_notified")


class PaymentAdmin(admin.ModelAdmin):
	list_display = ('transaction_number', 'organization', 'agent', 'amount', 'method', 'status', 'date', 'booking')
	list_filter = ('status', 'method', 'organization', 'date')
	search_fields = ('transaction_number', 'agent__username', 'booking__booking_number')
	readonly_fields = ('transaction_number', 'date')
	actions = ['approve_payment']

	def approve_payment(self, request, queryset):
		"""Admin action to approve selected payments and create ledger entries"""
		from django.db import transaction
		from organization.ledger_utils import create_entry_with_lines, find_account
		from django.contrib import messages

		approved_count = 0
		for payment in queryset.filter(status__iexact='pending'):
			try:
				with transaction.atomic():
					payment.status = 'Completed'
					payment.save(update_fields=['status'])

					# Create ledger entry for the payment
					cash_acc = find_account(payment.organization_id, ['CASH', 'BANK']) or find_account(None, ['CASH', 'BANK'])
					suspense_acc = find_account(payment.organization_id, ['SUSPENSE', 'RECEIVABLE']) or find_account(None, ['SUSPENSE', 'RECEIVABLE'])
					
					if cash_acc and suspense_acc:
						amount = payment.amount or 0
						audit_note = f"[admin] Payment #{payment.id} approved - {payment.transaction_number}"
						create_entry_with_lines(
							booking_no=payment.booking.booking_number if payment.booking else f"PAY-{payment.id}",
							service_type='payment',
							narration=f"Agent payment {payment.transaction_number}",
							metadata={'payment_id': payment.id, 'agent_id': payment.agent.id if payment.agent else None},
							internal_notes=[audit_note],
							created_by=request.user,
							lines=[
								{
									'account': cash_acc,
									'debit': amount,
									'credit': 0,
								},
								{
									'account': suspense_acc,
									'debit': 0,
									'credit': amount,
								}
							],
							organization=payment.organization
						)
						messages.success(request, f"Payment {payment.transaction_number} approved and ledger entry created.")
					else:
						messages.warning(request, f"Payment {payment.transaction_number} approved but no ledger entry created (missing ledger accounts).")
					approved_count += 1
			except Exception as e:
				messages.error(request, f"Failed to approve payment {payment.transaction_number}: {str(e)}")

		if approved_count > 0:
			messages.success(request, f"Successfully processed {approved_count} payment(s).")

	approve_payment.short_description = "Approve selected payments and create ledger entries"


admin.site.register(Booking, BookingAdmin)
admin.site.register(Discount)
admin.site.register(DiscountGroup)
admin.site.register(Markup)
admin.site.register(BankAccount)
admin.site.register(AllowedReseller)
admin.site.register(BookingHotelDetails)
admin.site.register(BookingPersonDetail, BookingPersonDetailAdmin)
admin.site.register(BookingTicketDetails)
admin.site.register(HotelOutsourcing, HotelOutsourcingAdmin)

# Register new integrated booking models
admin.site.register(BookingItem)
admin.site.register(BookingPax)
admin.site.register(BookingStatusTimeline)
admin.site.register(BookingPromotion)
admin.site.register(BookingPayment)
admin.site.register(Payment, PaymentAdmin)
