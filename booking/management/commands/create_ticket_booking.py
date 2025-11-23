from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import timedelta
import json

class Command(BaseCommand):
    help = 'Create a booking for a ticket with nested ticket_details and person_details using the BookingSerializer'

    def add_arguments(self, parser):
        parser.add_argument('--ticket-id', type=int, required=True, help='Ticket id to attach')
        parser.add_argument('--organization-id', type=int, required=True, help='Organization id')
        parser.add_argument('--user-id', type=int, required=True, help='User id (agent)')
        parser.add_argument('--agency-id', type=int, required=True, help='Agency id')
        parser.add_argument('--branch-id', type=int, required=True, help='Branch id')
        parser.add_argument('--first-name', type=str, default='Passenger', help='Passenger first name')
        parser.add_argument('--last-name', type=str, default='Test', help='Passenger last name')
        parser.add_argument('--phone', type=str, default='', help='Passenger phone number')
        parser.add_argument('--amount', type=float, default=12000, help='Total ticket amount')

    def handle(self, *args, **options):
        ticket_id = options['ticket_id']
        org_id = options['organization_id']
        user_id = options['user_id']
        agency_id = options['agency_id']
        branch_id = options['branch_id']
        first_name = options['first_name']
        last_name = options['last_name']
        phone = options['phone']
        amount = float(options['amount'])

        # Delay importing Django models/serializers until runtime
        try:
            from booking.serializers import BookingSerializer
        except Exception as e:
            raise CommandError(f'Failed to import BookingSerializer: {e}')

        expiry = (timezone.now() + timedelta(hours=24)).isoformat()

        # Try to fetch the Ticket record to populate required fields
        ticket_pnr = ''
        ticket_trip_type = 'Departure'
        try:
            from tickets.models import Ticket
            ticket_obj = Ticket.objects.filter(pk=ticket_id).first()
            if ticket_obj:
                ticket_pnr = getattr(ticket_obj, 'pnr', '') or ''
                ticket_trip_type = getattr(ticket_obj, 'trip_type', '') or ticket_trip_type
        except Exception:
            ticket_obj = None

        payload = {
            'hotel_details': [],
            'transport_details': [],
            'ticket_details': [
                {
                    'ticket': int(ticket_id),
                    'ticket_id': int(ticket_id),
                    'adult_price': float(amount),
                    'child_price': 0,
                    'infant_price': 0,
                    'seats': 1,
                    'status': 'confirmed',
                    'pnr': ticket_pnr,
                    'trip_type': ticket_trip_type,
                    'departure_stay_type': 'None',
                    'return_stay_type': 'None',
                }
            ],
            'person_details': [
                {
                    'ziyarat_details': [],
                    'food_details': [],
                    'contact_details': [{'phone_number': phone, 'remarks': ''}],
                    'age_group': 'Adult',
                    'person_title': '',
                    'first_name': first_name,
                    'last_name': last_name,
                    'passport_number': '',
                    'date_of_birth': None,
                    'passport_issue_date': None,
                    'passport_expiry_date': None,
                    'country': '',
                    'is_visa_included': False,
                    'is_ziyarat_included': False,
                    'is_food_included': False,
                    'visa_price': 0,
                    'visa_status': 'No',
                    'ticket_status': 'NOT APPROVED',
                }
            ],
            'payment_details': [],
            'booking_number': '',
            'expiry_time': expiry,
            'total_pax': 1,
            'total_adult': 1,
            'total_infant': 0,
            'total_child': 0,
            'total_ticket_amount': float(amount),
            'total_amount': float(amount),
            'is_paid': False,
            'status': 'Pending',
            'payment_status': 'Pending',
            'is_partial_payment_allowed': False,
            'category': 'Ticket_Booking',
            'user_id': int(user_id),
            'organization_id': int(org_id),
            'branch_id': int(branch_id),
            'agency_id': int(agency_id),
        }

        self.stdout.write('Creating booking with payload:')
        self.stdout.write(json.dumps(payload, indent=2, default=str))

        serializer = BookingSerializer(data=payload, context={'request': None})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            raise CommandError(f'Validation failed: {e}\nErrors: {getattr(serializer, "errors", None)}')

        try:
            booking = serializer.save()
        except Exception as e:
            raise CommandError(f'Failed to save booking: {e}')

        self.stdout.write(self.style.SUCCESS(f'Created booking id={booking.id}, booking_number={booking.booking_number}'))
        # print nested counts for quick verification
        try:
            td_count = booking.ticket_details.count()
            pd_count = booking.person_details.count()
        except Exception:
            td_count = 'n/a'
            pd_count = 'n/a'

        self.stdout.write(f'ticket_details count: {td_count}')
        self.stdout.write(f'person_details count: {pd_count}')
