"""
List all available ziyarat options in the database.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import ZiaratPrice

print("=" * 80)
print("ALL ZIYARAT OPTIONS IN DATABASE")
print("=" * 80)

ziyarats = ZiaratPrice.objects.all().order_by('city__name', 'ziarat_title')

print(f"\nTotal Ziyarat Options: {ziyarats.count()}\n")

for z in ziyarats:
    print(f"\nID: {z.id}")
    print(f"  Title: {z.ziarat_title}")
    print(f"  City: {z.city.name if z.city else 'N/A'}")
    print(f"  Organization: {z.organization.name}")
    print(f"  Status: {z.status}")
    print(f"  Adult Selling Price: {z.adult_selling_price}")
    print(f"  Child Selling Price: {z.child_selling_price}")
    print(f"  Contact: {z.contact_person} - {z.contact_number}")
    print(f"  Description: {z.description or 'N/A'}")

print("\n" + "=" * 80)
