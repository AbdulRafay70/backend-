import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from packages.models import TransportSectorPrice
from organization.models import Organization

# Get the first organization
try:
    org = Organization.objects.first()
    if not org:
        print("❌ No organization found! Please create an organization first.")
        exit()
    
    print(f"✓ Using organization: {org.name}")
    
    # Sample transport sectors for Umrah packages
    transports = [
        {
            "organization": org,
            "reference": "makkah_madinah",
            "name": "Makkah to Madinah Transport",
            "vehicle_type": 1,
            "adault_price": 150.0,
            "child_price": 75.0,
            "infant_price": 0.0,
            "is_visa": False,
            "only_transport_charge": True,
        },
        {
            "organization": org,
            "reference": "airport_makkah",
            "name": "Jeddah Airport to Makkah Hotel",
            "vehicle_type": 2,
            "adault_price": 200.0,
            "child_price": 100.0,
            "infant_price": 0.0,
            "is_visa": False,
            "only_transport_charge": True,
        },
        {
            "organization": org,
            "reference": "airport_madinah",
            "name": "Madinah Airport to Hotel",
            "vehicle_type": 2,
            "adault_price": 180.0,
            "child_price": 90.0,
            "infant_price": 0.0,
            "is_visa": False,
            "only_transport_charge": True,
        },
        {
            "organization": org,
            "reference": "ziyarat_makkah",
            "name": "Makkah City Ziyarat Tour",
            "vehicle_type": 3,
            "adault_price": 100.0,
            "child_price": 50.0,
            "infant_price": 0.0,
            "is_visa": False,
            "only_transport_charge": False,
        },
        {
            "organization": org,
            "reference": "ziyarat_madinah",
            "name": "Madinah City Ziyarat Tour",
            "vehicle_type": 3,
            "adault_price": 120.0,
            "child_price": 60.0,
            "infant_price": 0.0,
            "is_visa": False,
            "only_transport_charge": False,
        },
        {
            "organization": org,
            "reference": "full_package",
            "name": "Complete Umrah Transport Package",
            "vehicle_type": 4,
            "adault_price": 500.0,
            "child_price": 250.0,
            "infant_price": 0.0,
            "is_visa": True,
            "only_transport_charge": False,
        },
    ]
    
    created_count = 0
    for transport_data in transports:
        transport, created = TransportSectorPrice.objects.get_or_create(
            organization=transport_data["organization"],
            reference=transport_data["reference"],
            defaults=transport_data
        )
        
        if created:
            print(f"✓ Created: {transport.name} (Adult: ${transport.adault_price})")
            created_count += 1
        else:
            print(f"⚠ Already exists: {transport.name}")
    
    print(f"\n✅ Total transports: {TransportSectorPrice.objects.filter(organization=org).count()}")
    print(f"✅ Newly created: {created_count}")
    print(f"\n🔗 Organization: {org.name}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
