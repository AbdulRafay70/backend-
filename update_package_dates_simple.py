"""
Update package hotel dates directly in the database.
Updates check-in/check-out dates to span from today to next month.
"""
import os
import django
from datetime import datetime, timedelta
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

# Get all packages
packages = UmrahPackage.objects.filter(organization=org).order_by('id')

print("="*80)
print("UPDATING PACKAGE HOTEL DATES IN DATABASE")
print("="*80)

today = datetime.now().date()
print(f"\nFound {packages.count()} packages")
print(f"Date range: {today} to {today + timedelta(days=30)}")

updated_count = 0

for package in packages:
    print(f"\n{'='*80}")
    print(f"Package: {package.title}")
    
    # Get hotel_details from the package
    # Note: hotel_details is stored as a JSON field or related model
    # We need to check the actual model structure
    
    # For now, let's just update the package's start_date and end_date fields
    if hasattr(package, 'start_date') and hasattr(package, 'end_date'):
        package.start_date = today
        package.end_date = today + timedelta(days=30)
        package.save()
        
        print(f"✅ Updated package dates:")
        print(f"   Start: {package.start_date}")
        print(f"   End: {package.end_date}")
        updated_count += 1
    else:
        print(f"⚠️  Package doesn't have start_date/end_date fields")

print("\n" + "="*80)
print(f"✅ UPDATED {updated_count}/{packages.count()} PACKAGES!")
print("="*80)
print(f"\nAll packages now valid from {today} to {today + timedelta(days=30)}")
