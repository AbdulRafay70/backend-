from django.contrib import admin
from django import forms
from .models import (
	Ticket,
	TicketTripDetails,
	TickerStopoverDetails,
	Hotels,
	HotelPrices,
	HotelContactDetails,
	HotelRooms,
	RoomDetails,
	HotelPhoto,
)
import csv
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.urls import path
from django.contrib import messages


# Inline for Ticket Trip Details
class TicketTripDetailsInline(admin.TabularInline):
	model = TicketTripDetails
	extra = 1
	fields = ('departure_city', 'arrival_city', 'departure_date_time', 'arrival_date_time', 'trip_type')


# Inline for Ticket Stopover Details
class TicketStopoverDetailsInline(admin.TabularInline):
	model = TickerStopoverDetails
	extra = 0
	fields = ('stopover_city', 'stopover_duration', 'trip_type')


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
	list_display = (
		'id', 'flight_number', 'airline', 'get_route', 'departure_date', 'departure_time',
		'seat_type', 'adult_fare', 'status', 'get_availability', 'organization', 'branch'
	)
	list_filter = (
		'status', 'seat_type', 'airline', 'departure_date', 'organization', 'branch',
		'refund_rule', 'is_meal_included', 'is_umrah_seat'
	)
	search_fields = (
		'flight_number', 'pnr', 'airline__name', 'origin__name', 'destination__name', 'id'
	)
	readonly_fields = ('created_at', 'updated_at', 'booked_tickets', 'confirmed_tickets', 'left_seats', 'get_occupancy_rate')
	
	fieldsets = (
		('Flight Information', {
			'fields': ('organization', 'branch', 'airline', 'flight_number', 'pnr')
		}),
		('Route', {
			'fields': ('origin', 'destination')
		}),
		('Schedule', {
			'fields': (
				('departure_date', 'departure_time'),
				('arrival_date', 'arrival_time')
			)
		}),
		('Seat & Pricing', {
			'fields': (
				'seat_type',
				('adult_fare', 'child_fare', 'infant_fare')
			)
		}),
		('Baggage', {
			'fields': (('baggage_weight', 'baggage_pieces'),)
		}),
		('Rules & Services', {
			'fields': ('refund_rule', 'is_refundable', 'is_meal_included')
		}),
		('Inventory', {
			'fields': (
				'total_seats',
				('booked_tickets', 'confirmed_tickets', 'left_seats'),
				'get_occupancy_rate',
				'status'
			)
		}),
		('Trip Details', {
			'fields': ('trip_type', 'departure_stay_type', 'return_stay_type', 'is_umrah_seat'),
			'classes': ('collapse',)
		}),
		('Ownership & Reselling', {
			'fields': ('owner_organization_id', 'inventory_owner_organization_id', 'reselling_allowed'),
			'classes': ('collapse',)
		}),
		('Timestamps', {
			'fields': ('created_at', 'updated_at'),
			'classes': ('collapse',)
		}),
	)
	
	inlines = [TicketTripDetailsInline, TicketStopoverDetailsInline]
	
	actions = ['export_tickets_csv', 'mark_as_sold_out', 'mark_as_available']
	
	def get_route(self, obj):
		"""Display route in list view"""
		origin = obj.origin.name if obj.origin else 'N/A'
		destination = obj.destination.name if obj.destination else 'N/A'
		return f"{origin} → {destination}"
	get_route.short_description = 'Route'
	
	def get_availability(self, obj):
		"""Display seat availability"""
		if obj.left_seats > 0:
			color = 'green' if obj.left_seats > 10 else 'orange'
		else:
			color = 'red'
		return f'<span style="color: {color}; font-weight: bold;">{obj.left_seats}/{obj.total_seats}</span>'
	get_availability.short_description = 'Available Seats'
	get_availability.allow_tags = True
	
	def get_occupancy_rate(self, obj):
		"""Display occupancy rate"""
		rate = obj.occupancy_rate
		color = 'green' if rate > 70 else 'orange' if rate > 40 else 'red'
		return f'<span style="color: {color}; font-weight: bold;">{rate:.1f}%</span>'
	get_occupancy_rate.short_description = 'Occupancy Rate'
	get_occupancy_rate.allow_tags = True
	
	def export_tickets_csv(self, request, queryset):
		"""Export selected tickets to CSV"""
		response = HttpResponse(content_type='text/csv')
		response['Content-Disposition'] = 'attachment; filename="tickets_export.csv"'
		
		writer = csv.writer(response)
		writer.writerow([
			'ID', 'Flight Number', 'Airline', 'Origin', 'Destination',
			'Departure Date', 'Departure Time', 'Arrival Date', 'Arrival Time',
			'Seat Type', 'Adult Fare', 'Child Fare', 'Infant Fare',
			'Total Seats', 'Left Seats', 'Status', 'PNR'
		])
		
		for ticket in queryset:
			writer.writerow([
				ticket.id,
				ticket.flight_number,
				ticket.airline.name if ticket.airline else '',
				ticket.origin.name if ticket.origin else '',
				ticket.destination.name if ticket.destination else '',
				ticket.departure_date,
				ticket.departure_time,
				ticket.arrival_date,
				ticket.arrival_time,
				ticket.seat_type,
				ticket.adult_fare,
				ticket.child_fare,
				ticket.infant_fare,
				ticket.total_seats,
				ticket.left_seats,
				ticket.status,
				ticket.pnr,
			])
		
		return response
	export_tickets_csv.short_description = 'Export selected tickets to CSV'
	
	def mark_as_sold_out(self, request, queryset):
		"""Mark selected tickets as sold out"""
		updated = queryset.update(status='sold_out')
		self.message_user(request, f'{updated} ticket(s) marked as sold out.', messages.SUCCESS)
	mark_as_sold_out.short_description = 'Mark as Sold Out'
	
	def mark_as_available(self, request, queryset):
		"""Mark selected tickets as available"""
		updated = queryset.update(status='available')
		self.message_user(request, f'{updated} ticket(s) marked as available.', messages.SUCCESS)
	mark_as_available.short_description = 'Mark as Available'
	
	def get_urls(self):
		"""Add custom URL for bulk upload"""
		urls = super().get_urls()
		custom_urls = [
			path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), name='tickets_ticket_bulk_upload'),
		]
		return custom_urls + urls
	
	def bulk_upload_view(self, request):
		"""Handle bulk ticket upload from CSV/Excel"""
		if request.method == 'POST' and request.FILES.get('csv_file'):
			csv_file = request.FILES['csv_file']
			
			# Process CSV file
			try:
				import io
				from packages.models import Airlines, City
				from organization.models import Organization, Branch
				from datetime import datetime, time, date
				
				decoded_file = csv_file.read().decode('utf-8')
				io_string = io.StringIO(decoded_file)
				reader = csv.DictReader(io_string)
				
				created_count = 0
				error_count = 0
				errors = []
				
				for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
					try:
						# Parse dates and times
						dep_date = datetime.strptime(row.get('departure_date', ''), '%Y-%m-%d').date() if row.get('departure_date') else None
						dep_time = datetime.strptime(row.get('departure_time', ''), '%H:%M:%S').time() if row.get('departure_time') else None
						arr_date = datetime.strptime(row.get('arrival_date', ''), '%Y-%m-%d').date() if row.get('arrival_date') else None
						arr_time = datetime.strptime(row.get('arrival_time', ''), '%H:%M:%S').time() if row.get('arrival_time') else None
						
						# Get foreign key objects
						airline = Airlines.objects.get(id=int(row.get('airline_id', 0))) if row.get('airline_id') else None
						origin = City.objects.get(id=int(row.get('origin_id', 0))) if row.get('origin_id') else None
						destination = City.objects.get(id=int(row.get('destination_id', 0))) if row.get('destination_id') else None
						organization = Organization.objects.get(id=int(row.get('organization_id', 0))) if row.get('organization_id') else None
						branch = Branch.objects.get(id=int(row.get('branch_id', 0))) if row.get('branch_id') else None
						
						# Get total seats and calculate left_seats
						total_seats = int(row.get('total_seats', 0))
						
						# Create ticket
						ticket = Ticket.objects.create(
							organization=organization,
							branch=branch,
							airline=airline,
							flight_number=row.get('flight_number', ''),
							origin=origin,
							destination=destination,
							departure_date=dep_date,
							departure_time=dep_time,
							arrival_date=arr_date,
							arrival_time=arr_time,
							seat_type=row.get('seat_type', 'economy'),
							adult_fare=float(row.get('adult_fare', 0)),
							child_fare=float(row.get('child_fare', 0)),
							infant_fare=float(row.get('infant_fare', 0)),
							baggage_weight=float(row.get('baggage_weight', 0)),
							baggage_pieces=int(row.get('baggage_pieces', 0)),
							refund_rule=row.get('refund_rule', 'non_refundable'),
							is_refundable=row.get('is_refundable', '').lower() == 'true',
							is_meal_included=row.get('is_meal_included', '').lower() == 'true',
							pnr=row.get('pnr', ''),
							total_seats=total_seats,
							left_seats=total_seats,  # Initially all seats are available
							booked_tickets=0,
							confirmed_tickets=0,
							status='available',
							trip_type=row.get('trip_type', ''),
							departure_stay_type=row.get('departure_stay_type', ''),
							return_stay_type=row.get('return_stay_type', ''),
							is_umrah_seat=row.get('is_umrah_seat', '').lower() == 'true',
							reselling_allowed=row.get('reselling_allowed', '').lower() == 'true',
						)
						created_count += 1
						
					except Exception as e:
						error_count += 1
						errors.append(f"Row {row_num}: {str(e)}")
						continue
				
				# Show results
				if created_count > 0:
					messages.success(request, f'✅ Successfully uploaded {created_count} ticket(s)!')
				
				if error_count > 0:
					error_msg = f'❌ Failed to upload {error_count} ticket(s). Errors:\n' + '\n'.join(errors[:10])  # Show first 10 errors
					if len(errors) > 10:
						error_msg += f'\n... and {len(errors) - 10} more errors.'
					messages.error(request, error_msg)
				
				if created_count > 0:
					return redirect('..')
					
			except Exception as e:
				messages.error(request, f'❌ Error processing file: {str(e)}')
		
		return render(request, 'admin/tickets/ticket/bulk_upload.html')


@admin.register(TicketTripDetails)
class TicketTripDetailsAdmin(admin.ModelAdmin):
	list_display = ('id', 'ticket', 'departure_city', 'arrival_city', 'departure_date_time', 'arrival_date_time', 'trip_type')
	list_filter = ('trip_type', 'departure_city', 'arrival_city')
	search_fields = ('ticket__flight_number', 'departure_city__name', 'arrival_city__name')


@admin.register(TickerStopoverDetails)
class TickerStopoverDetailsAdmin(admin.ModelAdmin):
	list_display = ('id', 'ticket', 'stopover_city', 'stopover_duration', 'trip_type')
	list_filter = ('trip_type', 'stopover_city')
	search_fields = ('ticket__flight_number', 'stopover_city__name')


# Inline for Hotel Contact Details
class HotelContactDetailsInline(admin.TabularInline):
	model = HotelContactDetails
	extra = 1
	fields = ('contact_person', 'contact_number')
	
	def formfield_for_foreignkey(self, db_field, request, **kwargs):
		"""Override to show only active hotels"""
		if db_field.name == "hotel":
			kwargs["queryset"] = Hotels.objects.filter(is_active=True).order_by('name')
		return super().formfield_for_foreignkey(db_field, request, **kwargs)


# Inline for Hotel Prices
class HotelPricesInline(admin.TabularInline):
	model = HotelPrices
	extra = 1
	fields = ('start_date', 'end_date', 'room_type', 'price', 'is_sharing_allowed')
	
	def formfield_for_foreignkey(self, db_field, request, **kwargs):
		"""Override to show only active hotels"""
		if db_field.name == "hotel":
			kwargs["queryset"] = Hotels.objects.filter(is_active=True).order_by('name')
		return super().formfield_for_foreignkey(db_field, request, **kwargs)


# Inline for Hotel Photos
class HotelPhotoInline(admin.TabularInline):
	model = HotelPhoto
	extra = 1
	fields = ('image', 'caption')


@admin.register(Hotels)
class HotelsAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'city', 'category', 'status', 'organization', 'is_active', 'contact_number')
	list_filter = ('status', 'category', 'is_active', 'city', 'organization')
	search_fields = ('name', 'city__name', 'address', 'contact_number')
	inlines = [HotelContactDetailsInline, HotelPricesInline, HotelPhotoInline]
	fieldsets = (
		('Basic Information', {
			'fields': ('organization', 'name', 'city', 'address', 'google_location', 'contact_number')
		}),
		('Category & Status', {
			'fields': ('category', 'status', 'is_active')
		}),
		('Media', {
			'fields': ('video',),
			'description': 'Upload hotel promotional video'
		}),
		('Availability', {
			'fields': ('available_start_date', 'available_end_date', 'distance')
		}),
		('Settings', {
			'fields': ('reselling_allowed',)
		}),
	)


# Ticket and related models are already registered with decorators above
# admin.site.register(Ticket)  # REMOVED - already registered with @admin.register(Ticket)
# admin.site.register(TicketTripDetails)  # REMOVED - already registered below
# admin.site.register(TickerStopoverDetails)  # REMOVED - already registered below


@admin.register(HotelPrices)
class HotelPricesAdmin(admin.ModelAdmin):
	list_display = ('id', 'hotel', 'room_type', 'price', 'start_date', 'end_date', 'is_sharing_allowed')
	list_filter = ('room_type', 'is_sharing_allowed', 'hotel')
	search_fields = ('hotel__name', 'room_type')
	
	def formfield_for_foreignkey(self, db_field, request, **kwargs):
		"""Override to show only active hotels in the dropdown"""
		if db_field.name == "hotel":
			kwargs["queryset"] = Hotels.objects.filter(is_active=True).order_by('name')
		return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(HotelContactDetails)
class HotelContactDetailsAdmin(admin.ModelAdmin):
	list_display = ('id', 'hotel', 'contact_person', 'contact_number')
	list_filter = ('hotel',)
	search_fields = ('hotel__name', 'contact_person', 'contact_number')
	
	def formfield_for_foreignkey(self, db_field, request, **kwargs):
		"""Override to show only active hotels in the dropdown"""
		if db_field.name == "hotel":
			# Only show active hotels, ordered by name
			kwargs["queryset"] = Hotels.objects.filter(is_active=True).order_by('name')
		return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(HotelRooms)
class HotelRoomsAdmin(admin.ModelAdmin):
	list_display = ('id', 'hotel', 'floor', 'room_type', 'room_number', 'total_beds')
	list_filter = ('hotel', 'floor', 'room_type')
	search_fields = ('hotel__name', 'room_number', 'room_type')
	
	def formfield_for_foreignkey(self, db_field, request, **kwargs):
		"""Override to show only active hotels in the dropdown"""
		if db_field.name == "hotel":
			kwargs["queryset"] = Hotels.objects.filter(is_active=True).order_by('name')
		return super().formfield_for_foreignkey(db_field, request, **kwargs)


admin.site.register(RoomDetails)
admin.site.register(HotelPhoto)
