"""
Fix Room Type Activation for Existing Packages
This script ensures all existing packages have the correct room type boolean values
"""

import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from organization.models import Organization

def fix_room_type_activation():
    """Set room type activation flags to True for existing packages"""
    
    print("🔧 Fixing room type activation for existing packages...")
    
    # Get SAER organization
    try:
        org = Organization.objects.get(org_code="ORG-0001")
        print(f"✅ Found organization: {org.name} ({org.org_code})")
    except Organization.DoesNotExist:
        print("❌ Organization ORG-0001 not found!")
        return
    
    # Get all packages for the organization
    packages = UmrahPackage.objects.filter(organization=org)
    print(f"📦 Found {packages.count()} packages to update")
    
    updated_count = 0
    
    for package in packages:
        print(f"\n📋 Processing: {package.title}")
        
        # Check current values
        current_values = {
            'is_sharing_active': package.is_sharing_active,
            'is_quaint_active': package.is_quaint_active,
            'is_quad_active': package.is_quad_active,
            'is_triple_active': package.is_triple_active,
            'is_double_active': package.is_double_active,
        }
        
        print(f"  Current values: {current_values}")
        
        # Update all room types to be active
        update_needed = False
        
        if not package.is_sharing_active:
            package.is_sharing_active = True
            update_needed = True
            
        if not package.is_quaint_active:
            package.is_quaint_active = True
            update_needed = True
            
        if not package.is_quad_active:
            package.is_quad_active = True
            update_needed = True
            
        if not package.is_triple_active:
            package.is_triple_active = True
            update_needed = True
            
        if not package.is_double_active:
            package.is_double_active = True
            update_needed = True
        
        if update_needed:
            package.save()
            updated_count += 1
            print(f"  ✅ Updated room type flags to True")
        else:
            print(f"  ✓ Already has correct values")
            
        # Verify after update
        package.refresh_from_db()
        new_values = {
            'is_sharing_active': package.is_sharing_active,
            'is_quaint_active': package.is_quaint_active,
            'is_quad_active': package.is_quad_active,
            'is_triple_active': package.is_triple_active,
            'is_double_active': package.is_double_active,
        }
        print(f"  New values: {new_values}")
    
    print(f"\n🎉 COMPLETED!")
    print(f"✅ Updated {updated_count} packages")
    print(f"📊 Total packages processed: {packages.count()}")
    print("\n💡 All room types should now be active and visible in the frontend!")

if __name__ == "__main__":
    fix_room_type_activation()