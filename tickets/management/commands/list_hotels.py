from django.core.management.base import BaseCommand
from tickets.models import Hotels

class Command(BaseCommand):
    help = "List all hotels in the database with their status"

    def add_arguments(self, parser):
        parser.add_argument('--inactive-only', action='store_true', help='Show only inactive hotels')
        parser.add_argument('--delete-inactive', action='store_true', help='Delete all inactive hotels')

    def handle(self, *args, **options):
        inactive_only = options['inactive_only']
        delete_inactive = options['delete_inactive']

        if delete_inactive:
            inactive_hotels = Hotels.objects.filter(is_active=False)
            count = inactive_hotels.count()
            if count > 0:
                self.stdout.write(f"\nFound {count} inactive hotels:")
                for hotel in inactive_hotels:
                    self.stdout.write(f"  - ID: {hotel.id}, Name: {hotel.name}, Org: {hotel.organization}")
                
                confirm = input("\nAre you sure you want to delete these hotels? (yes/no): ")
                if confirm.lower() == 'yes':
                    inactive_hotels.delete()
                    self.stdout.write(self.style.SUCCESS(f"\n✓ Deleted {count} inactive hotels"))
                else:
                    self.stdout.write(self.style.WARNING("\nAborted."))
            else:
                self.stdout.write("No inactive hotels found.")
            return

        if inactive_only:
            hotels = Hotels.objects.filter(is_active=False).order_by('id')
            self.stdout.write(f"\nInactive Hotels ({hotels.count()}):")
        else:
            hotels = Hotels.objects.all().order_by('id')
            self.stdout.write(f"\nAll Hotels ({hotels.count()}):")

        if hotels.count() == 0:
            self.stdout.write("  No hotels found.")
            return

        self.stdout.write("\n{:<5} {:<30} {:<20} {:<15} {:<10}".format(
            "ID", "Name", "City", "Organization", "Status"
        ))
        self.stdout.write("-" * 85)

        for hotel in hotels:
            city_name = hotel.city.name if hotel.city else "N/A"
            org_name = hotel.organization.name if hotel.organization else "N/A"
            status = "Active" if hotel.is_active else "Inactive"
            
            self.stdout.write("{:<5} {:<30} {:<20} {:<15} {:<10}".format(
                hotel.id,
                hotel.name[:28] if len(hotel.name) > 28 else hotel.name,
                city_name[:18] if len(city_name) > 18 else city_name,
                org_name[:13] if len(org_name) > 13 else org_name,
                status
            ))

        self.stdout.write("\n" + "="*85)
        active_count = Hotels.objects.filter(is_active=True).count()
        inactive_count = Hotels.objects.filter(is_active=False).count()
        self.stdout.write(f"Total: {hotels.count()} | Active: {active_count} | Inactive: {inactive_count}")
