"""
Run this script to populate passenger data:
From backend directory: python -c "import django; django.setup(); exec(open('populate_pax.py').read())"
"""
from booking.models import BookingPersonDetail
from datetime import date, timedelta
import random

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

print(f"Found {incomplete_passengers.count()} passengers with incomplete data")

updated_count = 0

for passenger in incomplete_passengers:
    # Update missing fields
    if not passenger.person_title:
        passenger.person_title = random.choice(titles)
    
    if not passenger.first_name:
        passenger.first_name = random.choice(first_names)
    
    if not passenger.last_name:
        passenger.last_name = random.choice(last_names)
    
    if not passenger.country:
        passenger.country = random.choice(countries)
    
    # Generate dates based on age group
    if not passenger.date_of_birth:
        if passenger.age_group == 'adult':
            years_old = random.randint(18, 65)
        elif passenger.age_group == 'child':
            years_old = random.randint(2, 17)
        elif passenger.age_group == 'infant':
            years_old = random.randint(0, 2)
        else:
            years_old = random.randint(18, 65)
        
        passenger.date_of_birth = date.today() - timedelta(days=years_old * 365)
    
    # Generate passport dates if missing
    if not passenger.passpoet_issue_date:
        passenger.passpoet_issue_date = date.today() - timedelta(days=random.randint(365, 1825))
    
    if not passenger.passport_expiry_date:
        passenger.passport_expiry_date = date.today() + timedelta(days=random.randint(1095, 2920))
    
    # Generate passport number if missing
    if not passenger.passport_number:
        passenger.passport_number = f"PK{random.randint(1000000, 9999999)}"
    
    # Generate contact number if missing
    if not passenger.contact_number:
        passenger.contact_number = f"+923{random.randint(100000000, 999999999)}"
    
    passenger.save()
    updated_count += 1
    
    print(f'✓ Updated passenger {passenger.id}: {passenger.first_name} {passenger.last_name}')

print(f'\n✅ Successfully updated {updated_count} passengers with complete data')
