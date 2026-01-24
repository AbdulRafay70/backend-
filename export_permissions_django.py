"""
Django Permissions Export Script
Run with: python export_permissions_django.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.core.management import call_command
from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType

print("\n" + "="*60)
print("SAERPK PERMISSIONS EXPORT")
print("="*60 + "\n")

output_file = 'permissions_data.json'

print(f"Exporting permissions to {output_file}...\n")

try:
    # Export using Django's dumpdata
    with open(output_file, 'w') as f:
        call_command(
            'dumpdata',
            'auth.permission',
            'auth.group',
            'contenttypes.contenttype',
            indent=2,
            stdout=f
        )
    
    print(f"✓ SUCCESS! Permissions exported to: {output_file}")
    
    # Show statistics
    print(f"\nStatistics:")
    print(f"  - Total Permissions: {Permission.objects.count()}")
    print(f"  - Total Groups: {Group.objects.count()}")
    print(f"  - Total Content Types: {ContentType.objects.count()}")
    
    print(f"\nTo import on friend's laptop:")
    print(f"  1. Copy {output_file} to their project")
    print(f"  2. Run: python manage.py loaddata {output_file}")
    
    print("\n" + "="*60 + "\n")
    
except Exception as e:
    print(f"✗ ERROR: {str(e)}")
    sys.exit(1)
