from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from users.models import PermissionExtension


class Command(BaseCommand):
    help = 'Delete the 31 visa and other permissions that were created incorrectly'

    def handle(self, *args, **options):
        # List of all permission codenames to delete
        permission_codenames = [
            'edit_riyal_rate_admin',
            'add_shirka_admin',
            'edit_shirka_admin',
            'delete_shirka_admin',
            'add_sector_admin',
            'edit_sector_admin',
            'delete_sector_admin',
            'add_big_sector_admin',
            'edit_big_sector_admin',
            'delete_big_sector_admin',
            'add_visa_transport_rate_admin',
            'edit_visa_transport_rate_admin',
            'delete_visa_transport_rate_admin',
            'edit_only_visa_rate_admin',
            'edit_long_term_visa_rate_admin',
            'add_transport_price_admin',
            'edit_transport_price_admin',
            'delete_transport_price_admin',
            'add_food_price_admin',
            'edit_food_price_admin',
            'delete_food_price_admin',
            'add_ziarat_price_admin',
            'edit_ziarat_price_admin',
            'delete_ziarat_price_admin',
            'add_flight_admin',
            'edit_flight_admin',
            'delete_flight_admin',
            'add_city_admin',
            'edit_city_admin',
            'delete_city_admin',
            'edit_booking_expire_time_admin',
        ]
        
        deleted_count = 0
        
        for codename in permission_codenames:
            try:
                permission = Permission.objects.get(codename=codename)
                perm_name = permission.name
                permission.delete()
                deleted_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Deleted permission: {codename} ({perm_name})')
                )
            except Permission.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'⚠ Permission not found: {codename}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error deleting {codename}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully deleted {deleted_count} permissions')
        )
