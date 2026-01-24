"""
Add ziyarat and food data for Org 44
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

try:
    from pax_movements.models import Ziyarat, FoodService
    from packages.models import FoodPrice
    from organization.models import Organization

    print("\n" + "="*70)
    print("Adding Ziyarat and Food Data for Org 44")
    print("="*70 + "\n")

    # Get Org 44
    org_44 = Organization.objects.get(id=44)
    print(f"Organization: {org_44.name}\n")

    # Create 2 Ziyarat entries
    print("Creating Ziyarat...")
    
    z1 = Ziyarat.objects.create(
        name="Makkah City Tour",
        city="Makkah",
        adult_price=50,
        child_price=25,
        infant_price=0,
        organization=org_44
    )
    print(f"1. {z1.name} - ID: {z1.id}")

    z2 = Ziyarat.objects.create(
        name="Madinah Landmarks",
        city="Madinah",
        adult_price=60,
        child_price=30,
        infant_price=0,
        organization=org_44
    )
    print(f"2. {z2.name} - ID: {z2.id}")

    # Create 2 Food entries
    print("\nCreating Food Prices...")
    
    f1 = FoodPrice.objects.create(
        name="Standard Meal Plan",
        adult_price=200,
        child_price=100,
        infant_price=50,
        organization=org_44
    )
    print(f"1. {f1.name} - ID: {f1.id}")

    f2 = FoodPrice.objects.create(
        name="Premium Meal Plan",
        adult_price=350,
        child_price=175,
        infant_price=75,
        organization=org_44
    )
    print(f"2. {f2.name} - ID: {f2.id}")

    print("\n" + "="*70)
    print("SUCCESS!")
    print("="*70 + "\n")

except Exception as e:
    print(f"\nERROR: {str(e)}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)
