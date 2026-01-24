"""
Add ziyarat and food data for Org 44 (aqib noonar)
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Ziyarat, Food
from organization.models import Organization

print(f"\n{'='*70}")
print("Adding Ziyarat and Food Data for Org 44")
print(f"{'='*70}\n")

# Get Org 44
org_44 = Organization.objects.get(id=44)
print(f"Organization: {org_44.name} (ID: {org_44.id})\n")

# Create 2 Ziyarat entries
print("Creating Ziyarat entries...")

ziyarat1 = Ziyarat.objects.create(
    name="Makkah City Tour",
    city="Makkah",
    description="Full day tour of historical sites in Makkah",
    adult_price=50.0,
    child_price=25.0,
    infant_price=0.0,
    organization=org_44,
    is_active=True
)
print(f"✅ Created Ziyarat 1: {ziyarat1.name} (ID: {ziyarat1.id})")
print(f"   - Adult: PKR {ziyarat1.adult_price}, Child: PKR {ziyarat1.child_price}")

ziyarat2 = Ziyarat.objects.create(
    name="Madinah Landmarks Tour",
    city="Madinah",
    description="Guided tour of important landmarks in Madinah",
    adult_price=60.0,
    child_price=30.0,
    infant_price=0.0,
    organization=org_44,
    is_active=True
)
print(f"✅ Created Ziyarat 2: {ziyarat2.name} (ID: {ziyarat2.id})")
print(f"   - Adult: PKR {ziyarat2.adult_price}, Child: PKR {ziyarat2.child_price}")

# Create 2 Food entries
print("\nCreating Food entries...")

food1 = Food.objects.create(
    name="Standard Meal Plan",
    description="3 meals per day - breakfast, lunch, dinner",
    adult_price=200.0,
    child_price=100.0,
    infant_price=50.0,
    organization=org_44,
    is_active=True
)
print(f"✅ Created Food 1: {food1.name} (ID: {food1.id})")
print(f"   - Adult: PKR {food1.adult_price}, Child: PKR {food1.child_price}")

food2 = Food.objects.create(
    name="Premium Meal Plan",
    description="Buffet-style meals with international cuisine",
    adult_price=350.0,
    child_price=175.0,
    infant_price=75.0,
    organization=org_44,
    is_active=True
)
print(f"✅ Created Food 2: {food2.name} (ID: {food2.id})")
print(f"   - Adult: PKR {food2.adult_price}, Child: PKR {food2.child_price}")

print(f"\n{'='*70}")
print("SUCCESS! All data created")
print(f"{'='*70}\n")
