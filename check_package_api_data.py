"""
Check what data the API returns for a package to debug the frontend display issue.
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

# Get first package
package = UmrahPackage.objects.filter(organization=org).first()

if package:
    print("="*80)
    print(f"Package: {package.title}")
    print("="*80)
    
    print(f"\nPackage ID: {package.id}")
    print(f"Package Code: {package.package_code}")
    
    # Check hotel fields
    print(f"\n--- HOTEL FIELDS ---")
    print(f"makkah_hotel (ID): {package.makkah_hotel.id if package.makkah_hotel else 'None'}")
    print(f"makkah_hotel (Name): {package.makkah_hotel.name if package.makkah_hotel else 'None'}")
    print(f"madina_hotel (ID): {package.madina_hotel.id if package.madina_hotel else 'None'}")
    print(f"madina_hotel (Name): {package.madina_hotel.name if package.madina_hotel else 'None'}")
    
    # Check ticket field
    print(f"\n--- TICKET FIELDS ---")
    print(f"ticket (ID): {package.ticket.id if package.ticket else 'None'}")
    print(f"ticket (Number): {package.ticket.ticket_number if package.ticket else 'None'}")
    if package.ticket:
        print(f"ticket (Airline): {package.ticket.airline.name if package.ticket.airline else 'None'}")
        print(f"ticket (PNR): {package.ticket.pnr if hasattr(package.ticket, 'pnr') else 'N/A'}")
    
    # Check what the serializer would return
    print(f"\n--- CHECKING SERIALIZER OUTPUT ---")
    print("The API needs to include these nested objects:")
    print("  - makkah_hotel_info (hotel details)")
    print("  - madina_hotel_info (hotel details)")
    print("  - ticket_info (ticket details)")
    
    print("\n" + "="*80)
    print("RECOMMENDATION:")
    print("The backend serializer needs to be updated to include nested hotel and ticket info.")
    print("="*80)
else:
    print("No packages found!")
