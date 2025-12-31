"""
Management command to update trip details for testing passenger movement tracking.
Usage: python manage.py update_trip_details_for_testing
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from tickets.models import Ticket, TicketTripDetails
from booking.models import BookingTicketDetails
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Update trip details to test passenger movement status changes'

    def handle(self, *args, **options):
        now = timezone.now()
        self.stdout.write(f"Current time: {now}")
        
        # Get all ticket trip details 
        trip_details = TicketTripDetails.objects.all().order_by('id')
        
        if not trip_details.exists():
            self.stdout.write(self.style.ERROR("No trip details found!"))
            return
            
        self.stdout.write(f"Found {trip_details.count()} trip details")
        
        # Update trip details with varied times to simulate different statuses:
        # 1. Some departed hours ago (In Flight now)
        # 2. Some arrived yesterday (In Makkah/Madina)
        # 3. Some arriving in the past hour (just landed)
        # 4. Some departing today (will be In Flight soon)
        # 5. Some departing in future (In Pakistan)
        
        updates = [
            # Flight departed 2 hours ago, arrives in 4 hours - IN FLIGHT
            {
                'index': 0,
                'departure': now - timedelta(hours=2),
                'arrival': now + timedelta(hours=4),
                'status': 'In Flight'
            },
            # Flight arrived yesterday - IN MAKKAH/MADINA
            {
                'index': 1,
                'departure': now - timedelta(days=1, hours=6),
                'arrival': now - timedelta(days=1),
                'status': 'In Makkah/Madina'
            },
            # Flight departed 5 hours ago, arriving in 1 hour - IN FLIGHT
            {
                'index': 2,
                'departure': now - timedelta(hours=5),
                'arrival': now + timedelta(hours=1),
                'status': 'In Flight'
            },
            # Flight arrived 3 days ago - IN MAKKAH (ready for exit check)
            {
                'index': 3,
                'departure': now - timedelta(days=3, hours=6),
                'arrival': now - timedelta(days=3),
                'status': 'In Makkah (3 days)'
            },
            # Flight departing in 18 hours - IN PAKISTAN (departing today)
            {
                'index': 4,
                'departure': now + timedelta(hours=18),
                'arrival': now + timedelta(hours=24),
                'status': 'In Pakistan (departing today)'
            },
        ]
        
        for update_info in updates:
            idx = update_info['index']
            if idx < trip_details.count():
                trip = trip_details[idx]
                trip.departure_date_time = update_info['departure']
                trip.arrival_date_time = update_info['arrival']
                trip.save()
                
                self.stdout.write(self.style.SUCCESS(
                    f"  ✓ Updated ticket {trip.ticket_id} trip detail:\n"
                    f"     Departure: {trip.departure_date_time}\n"
                    f"     Arrival: {trip.arrival_date_time}\n"
                    f"     Expected Status: {update_info['status']}"
                ))
        
        # Leave remaining trip details with future dates (In Pakistan)
        for i, trip in enumerate(trip_details[5:], start=5):
            # Future departures - varying days out
            days_out = (i - 4) * 2  # 2, 4, 6, 8... days from now
            trip.departure_date_time = now + timedelta(days=days_out)
            trip.arrival_date_time = now + timedelta(days=days_out, hours=6)
            trip.save()
            self.stdout.write(f"  • Ticket {trip.ticket_id}: departing in {days_out} days (In Pakistan)")
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Updated {trip_details.count()} trip details for testing!"))
        self.stdout.write("\n📊 Expected Status Distribution:")
        self.stdout.write("   - 2 passengers should be IN FLIGHT")
        self.stdout.write("   - 2 passengers should be IN MAKKAH/MADINA") 
        self.stdout.write("   - Remaining passengers should be IN PAKISTAN")
        self.stdout.write("\n🔄 Refresh the Pax Movement page to see the changes!")
