"""
Management command to create a comprehensive test booking with all fields populated.
This demonstrates the complete integrated booking system with items, passengers, payments, etc.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta

from booking.models import (
    Booking, BookingItem, BookingPax, BookingPayment, 
    BookingPromotion, BookingStatusTimeline, HotelOutsourcing
)
from organization.models import Organization, Branch, Agency
from packages.models import (
    UmrahPackage, Visa, TransportSectorPrice
)
from tickets.models import Ticket, Hotels


class Command(BaseCommand):
    help = 'Create a comprehensive test booking with all fields populated'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Creating test booking...'))
        
        try:
            # Get or create test data
            user = self.get_or_create_user()
            organization = self.get_or_create_organization()
            branch = self.get_or_create_branch(organization)
            agency = self.get_or_create_agency(organization, branch)
            
            # Create the main booking
            booking = self.create_booking(user, organization, branch, agency)
            
            # Add booking items (hotels, transport, packages, visas)
            self.add_booking_items(booking)
            
            # Add passengers (PAX)
            self.add_passengers(booking)
            
            # Add payments
            self.add_payments(booking, user)
            
            # Add status timeline
            self.add_status_timeline(booking, user)
            
            # Update totals
            self.update_booking_totals(booking)
            
            self.stdout.write(self.style.SUCCESS(
                f'\n✅ Successfully created test booking: {booking.booking_number}'
            ))
            self.stdout.write(self.style.SUCCESS(f'   Customer: {booking.customer_name}'))
            self.stdout.write(self.style.SUCCESS(f'   Total Passengers: {booking.total_pax}'))
            self.stdout.write(self.style.SUCCESS(f'   Total Amount: PKR {booking.total_amount:,.2f}'))
            self.stdout.write(self.style.SUCCESS(f'   Paid Amount: PKR {booking.paid_payment:,.2f}'))
            self.stdout.write(self.style.SUCCESS(f'   Pending: PKR {booking.pending_payment:,.2f}'))
            self.stdout.write(self.style.SUCCESS(f'\n   View in admin: /admin/booking/booking/{booking.pk}/change/'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error creating booking: {str(e)}'))
            import traceback
            traceback.print_exc()

    def get_or_create_user(self):
        """Get or create a test user"""
        user, created = User.objects.get_or_create(
            username='test_employee',
            defaults={
                'email': 'test@saer.pk',
                'first_name': 'Test',
                'last_name': 'Employee'
            }
        )
        if created:
            user.set_password('test123')
            user.save()
            self.stdout.write(self.style.SUCCESS('   ✓ Created test user'))
        else:
            self.stdout.write('   ℹ Using existing user')
        return user

    def get_or_create_organization(self):
        """Get or create test organization"""
        org = Organization.objects.first()
        if not org:
            org = Organization.objects.create(
                name='Test Organization',
                org_code='TEST-ORG',
                email='org@saer.pk',
                phone='0300-1234567'
            )
            self.stdout.write(self.style.SUCCESS('   ✓ Created test organization'))
        else:
            self.stdout.write(f'   ℹ Using organization: {org.name}')
        return org

    def get_or_create_branch(self, organization):
        """Get or create test branch"""
        branch = Branch.objects.filter(organization=organization).first()
        if not branch:
            branch = Branch.objects.create(
                organization=organization,
                name='Main Branch',
                branch_code='MAIN',
                email='branch@saer.pk',
                phone='0300-1234567'
            )
            self.stdout.write(self.style.SUCCESS('   ✓ Created test branch'))
        else:
            self.stdout.write(f'   ℹ Using branch: {branch.name}')
        return branch

    def get_or_create_agency(self, organization, branch):
        """Get or create test agency"""
        agency = Agency.objects.filter(organization=organization).first()
        if not agency:
            agency = Agency.objects.create(
                organization=organization,
                branch=branch,
                name='Test Travel Agency',
                agency_code='TTA',
                email='agency@saer.pk',
                phone='0300-1234567'
            )
            self.stdout.write(self.style.SUCCESS('   ✓ Created test agency'))
        else:
            self.stdout.write(f'   ℹ Using agency: {agency.name}')
        return agency

    def create_booking(self, user, organization, branch, agency):
        """Create the main booking with all fields"""
        booking_number = f'BK-{datetime.now().strftime("%Y%m%d")}-TEST-{timezone.now().timestamp():.0f}'
        
        booking = Booking.objects.create(
            user=user,
            organization=organization,
            branch=branch,
            agency=agency,
            booking_number=booking_number,
            
            # Customer information
            customer_name='Ahmed Ali Khan',
            customer_contact='+92-300-1234567',
            customer_email='ahmed.khan@example.com',
            customer_address='House 123, Street 456, Gulberg III, Lahore, Pakistan',
            
            # Booking details
            status='Confirmed',
            payment_status='Partial',
            booking_type='UMRAH',
            is_full_package=True,
            
            # Invoice details
            invoice_no=f'INV-{datetime.now().strftime("%Y%m%d")}-{timezone.now().timestamp():.0f}',
            
            # Financial details
            total_amount=0,  # Will be calculated
            paid_payment=0,  # Will be calculated
            pending_payment=0,  # Will be calculated
            total_discount=Decimal('5000.00'),
            discount_notes='Early bird discount - 5000 PKR off',
            
            # Ledger integration
            ledger_id=12345,
            
            # Flags
            is_public_booking=False,
            is_outsourced=True,
            is_partial_payment_allowed=True,
            
            # Notes
            client_note='Customer prefers window seats. Vegetarian meals required.',
            
            # Other details
            category='Premium',
            created_by_user_type='employee',
        )
        
        # Generate public reference
        booking.generate_public_ref()
        booking.save()
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Created booking: {booking.booking_number}'))
        return booking

    def add_booking_items(self, booking):
        """Add various booking items (hotel, transport, visa, ticket)"""
        items_created = 0
        
        # 1. Add Hotel Item
        hotel = Hotels.objects.first()
        if hotel:
            BookingItem.objects.create(
                booking=booking,
                inventory_type='hotel',
                item_name=f'{hotel.hotel_name} - Deluxe Room',
                description='5 nights accommodation in Makkah, Quad sharing',
                unit_price=Decimal('25000.00'),
                quantity=2,  # 2 rooms
                discount_amount=Decimal('2000.00'),
                item_details={
                    'hotel_id': hotel.id,
                    'check_in': '2025-12-01',
                    'check_out': '2025-12-06',
                    'room_type': 'deluxe',
                    'sharing_type': 'quad',
                    'nights': 5
                }
            )
            items_created += 1
            self.stdout.write('   ✓ Added hotel booking item')
        
        # 2. Add Transport Item
        transport = TransportSectorPrice.objects.first()
        if transport:
            BookingItem.objects.create(
                booking=booking,
                inventory_type='transport',
                transport=transport,
                item_name='Makkah to Madinah Transport',
                description='Luxury bus transport with AC',
                unit_price=Decimal('8000.00'),
                quantity=4,  # 4 passengers
                discount_amount=Decimal('500.00'),
                item_details={
                    'transport_date': '2025-12-06',
                    'pickup_point': 'Hotel Lobby',
                    'dropoff_point': 'Madinah Hotel',
                    'vehicle_type': 'luxury_bus',
                    'transport_type': 'intercity'
                }
            )
            items_created += 1
            self.stdout.write('   ✓ Added transport booking item')
        
        # 3. Add Visa Item
        visa = Visa.objects.first()
        if visa:
            BookingItem.objects.create(
                booking=booking,
                inventory_type='visa',
                visa=visa,
                item_name='Umrah Visa',
                description='30-day Umrah visa for Saudi Arabia',
                unit_price=Decimal('15000.00'),
                quantity=4,  # 4 passengers
                discount_amount=Decimal('1000.00'),
                item_details={
                    'visa_type': 'umrah',
                    'validity_days': 30,
                    'processing_time': '7 days'
                }
            )
            items_created += 1
            self.stdout.write('   ✓ Added visa booking item')
        
        # 4. Add Ticket Item
        ticket = Ticket.objects.first()
        if ticket:
            BookingItem.objects.create(
                booking=booking,
                inventory_type='ticket',
                ticket=ticket,
                item_name='Round-trip Flight Tickets',
                description='Lahore to Jeddah return tickets',
                unit_price=Decimal('45000.00'),
                quantity=4,  # 4 passengers
                discount_amount=Decimal('1500.00'),
                item_details={
                    'departure_date': '2025-12-01',
                    'return_date': '2025-12-15',
                    'airline': ticket.airline.name if ticket.airline else 'Saudi Airlines',
                    'flight_class': 'Economy'
                }
            )
            items_created += 1
            self.stdout.write('   ✓ Added ticket booking item')
        
        # 5. Add Package Item (if available)
        package = UmrahPackage.objects.first()
        if package:
            BookingItem.objects.create(
                booking=booking,
                inventory_type='package',
                package=package,
                item_name=f'{package.title} - Umrah Package',
                description=package.description or 'Complete Umrah package with hotel and transport',
                unit_price=Decimal('120000.00'),
                quantity=1,
                discount_amount=Decimal('0.00'),
                item_details={
                    'package_code': package.package_code,
                    'duration': '14 nights',
                    'makkah_nights': 8,
                    'madinah_nights': 6
                }
            )
            items_created += 1
            self.stdout.write('   ✓ Added package booking item')
        
        # Add some additional items
        BookingItem.objects.create(
            booking=booking,
            inventory_type='ziyarat',
            item_name='Ziyarat Tour',
            description='Historical Islamic sites tour in Makkah and Madinah',
            unit_price=Decimal('3000.00'),
            quantity=4,
            discount_amount=Decimal('0.00'),
            item_details={
                'tour_type': 'group',
                'duration': '2 days',
                'sites': ['Cave Hira', 'Uhud Mountain', 'Quba Mosque']
            }
        )
        items_created += 1
        
        BookingItem.objects.create(
            booking=booking,
            inventory_type='food',
            item_name='Meal Package',
            description='Buffet meals - Breakfast and Dinner',
            unit_price=Decimal('2000.00'),
            quantity=4,  # 4 persons
            discount_amount=Decimal('0.00'),
            item_details={
                'meal_type': 'buffet',
                'meals_included': ['breakfast', 'dinner'],
                'duration': '14 days'
            }
        )
        items_created += 1
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Total booking items created: {items_created}'))

    def add_passengers(self, booking):
        """Add passenger (PAX) details"""
        visa = Visa.objects.first()
        
        passengers = [
            {
                'first_name': 'Ahmed',
                'last_name': 'Khan',
                'passport_no': 'AB1234567',
                'pax_type': 'adult',
                'date_of_birth': '1980-05-15',
                'gender': 'M',
                'phone': '+92-300-1234567',
                'email': 'ahmed.khan@example.com',
                'nationality': 'Pakistani'
            },
            {
                'first_name': 'Fatima',
                'last_name': 'Khan',
                'passport_no': 'AB7654321',
                'pax_type': 'adult',
                'date_of_birth': '1985-08-22',
                'gender': 'F',
                'phone': '+92-300-7654321',
                'email': 'fatima.khan@example.com',
                'nationality': 'Pakistani'
            },
            {
                'first_name': 'Zainab',
                'last_name': 'Khan',
                'passport_no': 'AB1111111',
                'pax_type': 'child',
                'date_of_birth': '2015-03-10',
                'gender': 'F',
                'phone': '',
                'email': '',
                'nationality': 'Pakistani'
            },
            {
                'first_name': 'Ali',
                'last_name': 'Khan',
                'passport_no': 'AB2222222',
                'pax_type': 'infant',
                'date_of_birth': '2023-11-01',
                'gender': 'M',
                'phone': '',
                'email': '',
                'nationality': 'Pakistani'
            }
        ]
        
        for pax_data in passengers:
            BookingPax.objects.create(
                booking=booking,
                visa=visa,
                **pax_data
            )
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Added {len(passengers)} passengers'))

    def add_payments(self, booking, user):
        """Add payment records"""
        payments = [
            {
                'amount': Decimal('100000.00'),
                'payment_method': 'bank',
                'status': 'completed',
                'transaction_id': 'TXN-20251101-001',
                'reference_no': 'REF-12345',
                'notes': 'Initial advance payment via bank transfer'
            },
            {
                'amount': Decimal('50000.00'),
                'payment_method': 'cash',
                'status': 'completed',
                'transaction_id': 'TXN-20251101-002',
                'reference_no': 'CASH-001',
                'notes': 'Second installment - cash payment'
            },
            {
                'amount': Decimal('30000.00'),
                'payment_method': 'online',
                'status': 'pending',
                'transaction_id': 'TXN-20251101-003',
                'reference_no': 'ONL-789',
                'notes': 'Third installment - online payment pending'
            }
        ]
        
        for payment_data in payments:
            BookingPayment.objects.create(
                booking=booking,
                created_by=user,
                **payment_data
            )
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Added {len(payments)} payment records'))

    def add_status_timeline(self, booking, user):
        """Add status timeline entries"""
        timeline_entries = [
            {
                'status': 'Pending',
                'notes': 'Booking created and pending confirmation',
                'timestamp': timezone.now() - timedelta(hours=48)
            },
            {
                'status': 'Confirmed',
                'notes': 'Booking confirmed after payment received',
                'timestamp': timezone.now() - timedelta(hours=24)
            }
        ]
        
        for entry in timeline_entries:
            BookingStatusTimeline.objects.create(
                booking=booking,
                changed_by=user,
                **entry
            )
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Added {len(timeline_entries)} status timeline entries'))

    def update_booking_totals(self, booking):
        """Calculate and update booking totals"""
        from django.db.models import Sum
        
        # Update passenger counts
        booking.total_pax = booking.booking_pax.count()
        booking.total_adult = booking.booking_pax.filter(pax_type='adult').count()
        booking.total_child = booking.booking_pax.filter(pax_type='child').count()
        booking.total_infant = booking.booking_pax.filter(pax_type='infant').count()
        
        # Update amounts from booking items
        booking.total_ticket_amount = booking.booking_items.filter(
            inventory_type='ticket').aggregate(total=Sum('final_amount'))['total'] or 0
        booking.total_hotel_amount = booking.booking_items.filter(
            inventory_type='hotel').aggregate(total=Sum('final_amount'))['total'] or 0
        booking.total_transport_amount = booking.booking_items.filter(
            inventory_type='transport').aggregate(total=Sum('final_amount'))['total'] or 0
        booking.total_visa_amount = booking.booking_items.filter(
            inventory_type='visa').aggregate(total=Sum('final_amount'))['total'] or 0
        
        # Calculate total amount
        booking.total_amount = (
            booking.total_ticket_amount +
            booking.total_hotel_amount +
            booking.total_transport_amount +
            booking.total_visa_amount
        )
        
        # Calculate paid payment from payment records
        booking.paid_payment = booking.payment_records.filter(
            status='completed').aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate pending payment
        booking.pending_payment = booking.total_amount - booking.paid_payment
        
        booking.save()
        
        self.stdout.write(self.style.SUCCESS('   ✓ Updated booking totals'))
