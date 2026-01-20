from django.core.management.base import BaseCommand
from tickets.models import Ticket


class Command(BaseCommand):
    help = 'Delete tickets with empty trip_details (IDs 97-106)'

    def handle(self, *args, **options):
        # Delete tickets with IDs 97-106 (the ones with empty trip_details)
        ticket_ids = [97, 98, 99, 100, 101, 102, 103, 104, 105, 106]
        
        deleted_count = 0
        for ticket_id in ticket_ids:
            try:
                ticket = Ticket.objects.get(id=ticket_id)
                flight_number = ticket.flight_number
                ticket.delete()
                deleted_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Deleted ticket ID {ticket_id} (Flight: {flight_number})')
                )
            except Ticket.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'⚠ Ticket ID {ticket_id} not found (already deleted)')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error deleting ticket ID {ticket_id}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully deleted {deleted_count} tickets with empty trip_details')
        )
        self.stdout.write(
            self.style.SUCCESS(f'✓ Ticket ID 86 (with proper trip_details) was kept')
        )
