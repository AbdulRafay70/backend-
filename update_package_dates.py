"""
Update all package dates to span from today to next 1 month.
Updates hotel check-in/check-out dates for all packages.
"""
import os
import django
import requests
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from organization.models import Organization
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# Get organization 11
org = Organization.objects.get(id=11)
user = User.objects.filter(is_superuser=True).first()

# Generate token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

# Get all packages
packages = UmrahPackage.objects.filter(organization=org).order_by('id')

print("="*80)
print("UPDATING PACKAGE DATES")
print("="*80)
print(f"\nFound {packages.count()} packages to update")

today = datetime.now().date()
one_month_later = today + timedelta(days=30)

print(f"\nDate range: {today} to {one_month_later}")

updated_count = 0

for package in packages:
    print(f"\n{'='*80}")
    print(f"Updating: {package.title}")
    print(f"Package ID: {package.id}")
    
    # Get current hotel_details
    url = f'https://api.saer.pk/api/umrah-packages/{package.id}/'
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }
    
    try:
        # Fetch current package data
        response = requests.get(
            f"{url}?organization={org.id}",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch package: {response.status_code}")
            continue
        
        pkg_data = response.json()
        
        # Update hotel_details dates
        hotel_details = pkg_data.get('hotel_details', [])
        
        if len(hotel_details) >= 2:
            # First hotel (Makkah) - starts today
            makkah_nights = hotel_details[0].get('number_of_nights', 7)
            hotel_details[0]['check_in_date'] = str(today)
            hotel_details[0]['check_out_date'] = str(today + timedelta(days=makkah_nights))
            
            # Second hotel (Madinah) - starts after Makkah
            madinah_nights = hotel_details[1].get('number_of_nights', 7)
            hotel_details[1]['check_in_date'] = str(today + timedelta(days=makkah_nights))
            hotel_details[1]['check_out_date'] = str(today + timedelta(days=makkah_nights + madinah_nights))
            
            # Update the package
            update_payload = {
                'hotel_details': hotel_details,
            }
            
            # Use PATCH to update only hotel_details
            patch_response = requests.patch(
                f"{url}?organization={org.id}",
                json=update_payload,
                headers=headers
            )
            
            if patch_response.status_code in [200, 201]:
                print(f"✅ Updated successfully!")
                print(f"   Makkah: {hotel_details[0]['check_in_date']} to {hotel_details[0]['check_out_date']}")
                print(f"   Madinah: {hotel_details[1]['check_in_date']} to {hotel_details[1]['check_out_date']}")
                updated_count += 1
            else:
                print(f"❌ Failed to update: {patch_response.status_code}")
                print(f"   Error: {patch_response.text[:200]}")
        else:
            print(f"⚠️  Package has {len(hotel_details)} hotel(s), expected 2")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

print("\n" + "="*80)
print(f"✅ UPDATED {updated_count}/{packages.count()} PACKAGES!")
print("="*80)
print(f"\nAll packages now have dates from {today} to approximately {one_month_later}")
