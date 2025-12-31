import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

# Check packages for organization 11
pkgs = UmrahPackage.objects.filter(organization_id=11)
print(f'Total packages for org 11: {pkgs.count()}')

for p in pkgs[:10]:
    print(f'  - ID: {p.id}, Title: {p.title}, is_active: {p.is_active}, inventory_owner: {p.inventory_owner_organization_id}, reselling_allowed: {p.reselling_allowed}')

# Check if there are ANY packages in the database
all_pkgs = UmrahPackage.objects.all()
print(f'\nTotal packages in database: {all_pkgs.count()}')

if all_pkgs.count() > 0:
    print('\nSample packages:')
    for p in all_pkgs[:5]:
        print(f'  - ID: {p.id}, Org: {p.organization_id}, Title: {p.title}')
