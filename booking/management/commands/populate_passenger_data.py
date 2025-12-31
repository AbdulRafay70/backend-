from django.core.management.base import BaseCommand
from booking.models import BookingPersonDetail
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Populate incomplete passenger data with sample information for testing'

    def handle(self, *args, **options):
        # Sample data
        titles = ['Mr', 'Mrs', 'Miss', 'Dr']
        first_names = ['Ahmed', 'Fatima', 'Omar', 'Aisha', 'Ali', 'Zainab', 'Hassan', 'Maryam', 'Ibrahim', 'Khadija']
        last_names = ['Khan', 'Ahmed', 'Ali', 'Hassan', 'Hussain', 'Malik', 'Raza', 'Shah', 'Siddiqui', 'Zaidi']
        countries = ['Pakistan', 'Saudi Arabia', 'United Arab Emirates', 'United Kingdom', 'United States']
        
        # Get all passengers with incomplete data
        incomplete_passengers = BookingPersonDetail.objects.filter(
            first_name__isnull=True
        ) | BookingPersonDetail.objects.filter(
            last_name__isnull=True
        )
        
        updated_count = 0
        
        for passenger in incomplete_passengers:
            # Update missing fields
            if not passenger.person_title:
                # Set title based on age_group if available
                if passenger.age_group and passenger.age_group.lower() == 'child':
                    passenger.person_title = random.choice(['Master', 'Miss'])
                elif passenger.age_group and passenger.age_group.lower() == 'infant':
                    passenger.person_title = random.choice(['Baby', 'Infant'])
                else:
                    passenger.person_title = random.choice(titles)
            
            if not passenger.first_name:
                passenger.first_name = random.choice(first_names)
            
            if not passenger.last_name:
                passenger.last_name = random.choice(last_names)
            
            if not passenger.country:
                passenger.country = random.choice(countries)
            
            # Generate dates based on age group
            if not passenger.date_of_birth:
                if passenger.age_group and passenger.age_group.lower() == 'adult':
                    years_old = random.randint(18, 65)
                elif passenger.age_group and passenger.age_group.lower() == 'child':
                    years_old = random.randint(2, 17)
                elif passenger.age_group and passenger.age_group.lower() == 'infant':
                    years_old = random.randint(0, 2)
                else:
                    years_old = random.randint(18, 65)
                
                passenger.date_of_birth = date.today() - timedelta(days=years_old * 365)
            
            # Generate passport dates if missing
            if not passenger.passpoet_issue_date:
                # Issue date: 1-5 years ago
                passenger.passpoet_issue_date = date.today() - timedelta(days=random.randint(365, 1825))
            
            if not passenger.passport_expiry_date:
                # Expiry: 3-8 years from now
                passenger.passport_expiry_date = date.today() + timedelta(days=random.randint(1095, 2920))
            
            # Generate passport number if missing
            if not passenger.passport_number:
                passenger.passport_number = f"PK{random.randint(1000000, 9999999)}"
            
            # Generate contact number if missing
            if not passenger.contact_number:
                passenger.contact_number = f"+923{random.randint(100000000, 999999999)}"
            
            passenger.save()
            updated_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Updated passenger {passenger.id}: {passenger.first_name} {passenger.last_name}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully updated {updated_count} passengers with complete data'
            )
        )
