"""
Delete all existing packages for organization 11.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("DELETING ALL PACKAGES FOR ORGANIZATION 11")
print("="*80)

# Get count before deletion
count = UmrahPackage.objects.filter(organization=org).count()
print(f"\nFound {count} packages to delete")

# Delete all packages
UmrahPackage.objects.filter(organization=org).delete()

print(f"\n✅ Deleted {count} packages successfully!")
print("\n" + "="*80)
print("You can now create new packages through the Add Package form UI")
print("="*80)
