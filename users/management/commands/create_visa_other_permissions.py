from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension, User


class Command(BaseCommand):
    help = 'Create 31 admin permissions for Visa and Other settings with proper sub-category structure'

    def handle(self, *args, **options):
        # Get ContentType for User model
        content_type = ContentType.objects.get_for_model(User)
        
        created_count = 0
        updated_count = 0
        
        # Define all permissions with their sub-categories and types
        # Format: (codename, name, sub_category_keyword, type)
        permissions_data = [
            # Riyal Rate (1) - only edit
            ('edit_riyal_rate_admin', 'Can edit riyal rate in admin portal', 'Riyal Rate', 'edit'),
            
            # Shirka (3)
            ('add_shirka_admin', 'Can add shirka in admin portal', 'Shirka', 'add'),
            ('edit_shirka_admin', 'Can edit shirka in admin portal', 'Shirka', 'edit'),
            ('delete_shirka_admin', 'Can delete shirka in admin portal', 'Shirka', 'delete'),
            
            # Sector (3)
            ('add_sector_admin', 'Can add sector in admin portal', 'Sector', 'add'),
            ('edit_sector_admin', 'Can edit sector in admin portal', 'Sector', 'edit'),
            ('delete_sector_admin', 'Can delete sector in admin portal', 'Sector', 'delete'),
            
            # Big Sector (3)
            ('add_big_sector_admin', 'Can add big sector in admin portal', 'Big Sector', 'add'),
            ('edit_big_sector_admin', 'Can edit big sector in admin portal', 'Big Sector', 'edit'),
            ('delete_big_sector_admin', 'Can delete big sector in admin portal', 'Big Sector', 'delete'),
            
            # Visa and Transport Rate (3)
            ('add_visa_transport_rate_admin', 'Can add visa and transport rate in admin portal', 'Visa and Transport Rate', 'add'),
            ('edit_visa_transport_rate_admin', 'Can edit visa and transport rate in admin portal', 'Visa and Transport Rate', 'edit'),
            ('delete_visa_transport_rate_admin', 'Can delete visa and transport rate in admin portal', 'Visa and Transport Rate', 'delete'),
            
            # Only Visa Rates (2) - only edit
            ('edit_only_visa_rate_admin', 'Can edit only visa rate in admin portal', 'Only Visa Rates', 'edit'),
            ('edit_long_term_visa_rate_admin', 'Can edit long term visa rate in admin portal', 'Only Visa Rates', 'edit'),
            
            # Transport Prices (3)
            ('add_transport_price_admin', 'Can add transport price in admin portal', 'Transport Prices', 'add'),
            ('edit_transport_price_admin', 'Can edit transport price in admin portal', 'Transport Prices', 'edit'),
            ('delete_transport_price_admin', 'Can delete transport price in admin portal', 'Transport Prices', 'delete'),
            
            # Food Prices (3)
            ('add_food_price_admin', 'Can add food price in admin portal', 'Food Prices', 'add'),
            ('edit_food_price_admin', 'Can edit food price in admin portal', 'Food Prices', 'edit'),
            ('delete_food_price_admin', 'Can delete food price in admin portal', 'Food Prices', 'delete'),
            
            # Ziarat Prices (3)
            ('add_ziarat_price_admin', 'Can add ziarat price in admin portal', 'Ziarat Prices', 'add'),
            ('edit_ziarat_price_admin', 'Can edit ziarat price in admin portal', 'Ziarat Prices', 'edit'),
            ('delete_ziarat_price_admin', 'Can delete ziarat price in admin portal', 'Ziarat Prices', 'delete'),
            
            # Flight (3)
            ('add_flight_admin', 'Can add flight (name, IATA code, logo) in admin portal', 'Flight', 'add'),
            ('edit_flight_admin', 'Can edit flight (name, IATA code, logo) in admin portal', 'Flight', 'edit'),
            ('delete_flight_admin', 'Can delete flight in admin portal', 'Flight', 'delete'),
            
            # City (3)
            ('add_city_admin', 'Can add city (name, IATA code) in admin portal', 'City', 'add'),
            ('edit_city_admin', 'Can edit city (name, IATA code) in admin portal', 'City', 'edit'),
            ('delete_city_admin', 'Can delete city in admin portal', 'City', 'delete'),
            
            # Booking Settings (1) - only edit
            ('edit_booking_expire_time_admin', 'Can set time for booking expire in admin portal', 'Booking Settings', 'edit'),
        ]
        
        # Create or update each permission
        for codename, name, sub_category, perm_type in permissions_data:
            permission, created = Permission.objects.get_or_create(
                codename=codename,
                content_type=content_type,
                defaults={'name': name}
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created permission: {codename}')
                )
            else:
                # Update name if it changed
                if permission.name != name:
                    permission.name = name
                    permission.save()
                self.stdout.write(
                    self.style.WARNING(f'⚠ Permission already exists: {codename}')
                )
            
            # Create or update PermissionExtension with the type (add/edit/delete/view)
            extension, ext_created = PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_type}
            )
            
            if not ext_created:
                # Update existing extension
                extension.type = perm_type
                extension.save()
                updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully processed {len(permissions_data)} permissions')
        )
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created: {created_count} | Updated: {updated_count}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'✓ All permissions will be grouped under "Visa and Other Permissions"')
        )
        self.stdout.write(
            self.style.SUCCESS(f'✓ Sub-categories: Riyal Rate, Shirka, Sector, Big Sector, etc.')
        )
