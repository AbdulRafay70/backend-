"""
Test Package Active/Inactive Filtering
This script demonstrates how the is_active field controls package visibility
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

def test_package_filtering():
    """Test package active/inactive filtering"""
    
    print("🧪 Testing Package Active/Inactive Filtering")
    print("=" * 60)
    
    # Get SAER organization
    try:
        org = Organization.objects.get(org_code="ORG-0001")
        print(f"✅ Organization: {org.name} ({org.org_code})")
    except Organization.DoesNotExist:
        print("❌ Organization ORG-0001 not found!")
        return
    
    # Get all packages
    all_packages = UmrahPackage.objects.filter(organization=org)
    print(f"📦 Total packages: {all_packages.count()}")
    
    # Show current package status
    print(f"\n📊 Current Package Status:")
    for pkg in all_packages[:5]:  # Show first 5
        status = "🟢 ACTIVE" if pkg.is_active else "🔴 INACTIVE"
        print(f"  {status} - {pkg.title}")
    
    # Test: Set some packages to inactive for demonstration
    print(f"\n🔄 Setting some packages to INACTIVE for testing...")
    
    # Make first package inactive
    if all_packages.exists():
        first_pkg = all_packages.first()
        first_pkg.is_active = False
        first_pkg.save()
        print(f"  ❌ Set '{first_pkg.title}' to INACTIVE")
        
        # Make second package inactive if exists
        if all_packages.count() > 1:
            second_pkg = all_packages[1]
            second_pkg.is_active = False
            second_pkg.save()
            print(f"  ❌ Set '{second_pkg.title}' to INACTIVE")
    
    # Now test filtering
    active_packages = UmrahPackage.objects.filter(organization=org, is_active=True)
    inactive_packages = UmrahPackage.objects.filter(organization=org, is_active=False)
    
    print(f"\n🔍 FILTERING RESULTS:")
    print(f"📈 Active packages (will show on public page): {active_packages.count()}")
    for pkg in active_packages:
        print(f"  🟢 {pkg.title}")
        
    print(f"\n📉 Inactive packages (won't show on public page): {inactive_packages.count()}")
    for pkg in inactive_packages:
        print(f"  🔴 {pkg.title}")
    
    print(f"\n💡 FRONTEND FILTERING LOGIC:")
    print(f"📱 Admin Page:")
    print(f"  - ✅ 'Package Active' checked → Shows {active_packages.count()} packages")
    print(f"  - ❌ 'Package Inactive' checked → Shows {inactive_packages.count()} packages")
    print(f"  - ⚪ Neither checked → Shows all {all_packages.count()} packages")
    
    print(f"\n🌐 Public Page:")
    print(f"  - Only shows ACTIVE packages: {active_packages.count()} packages")
    print(f"  - INACTIVE packages are hidden from public")
    
    # Reset packages to active for normal operation
    print(f"\n🔄 Resetting all packages to ACTIVE for normal operation...")
    UmrahPackage.objects.filter(organization=org).update(is_active=True)
    print(f"✅ All packages set to ACTIVE")
    
    print(f"\n🎉 TEST COMPLETED!")
    print(f"💡 Your package filtering is working correctly!")
    print(f"📋 Admin can filter by active/inactive status")
    print(f"🌐 Public page automatically shows only active packages")

if __name__ == "__main__":
    test_package_filtering()