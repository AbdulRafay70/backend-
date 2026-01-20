from django.core.management.base import BaseCommand
from booking.models import BookingTicketTicketTripDetails


class Command(BaseCommand):
    help = 'Populate flight_number, airline_code, and city codes for existing trip details'

    def handle(self, *args, **options):
        trip_details = BookingTicketTicketTripDetails.objects.all()
        updated_count = 0
        
        for trip in trip_details:
            updated = False
            
            # Populate flight_number and airline_code from parent ticket
            if trip.ticket and trip.ticket.ticket:
                parent_ticket = trip.ticket.ticket
                
                if parent_ticket.flight_number and not trip.flight_number:
                    trip.flight_number = parent_ticket.flight_number
                    updated = True
                
                if parent_ticket.airline and parent_ticket.airline.code and not trip.airline_code:
                    trip.airline_code = parent_ticket.airline.code
                    updated = True
            
            # Populate city codes
            if trip.departure_city and trip.departure_city.code and not trip.departure_city_code:
                trip.departure_city_code = trip.departure_city.code
                updated = True
            
            if trip.arrival_city and trip.arrival_city.code and not trip.arrival_city_code:
                trip.arrival_city_code = trip.arrival_city.code
                updated = True
            
            if updated:
                trip.save()
                updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} trip details')
        )
