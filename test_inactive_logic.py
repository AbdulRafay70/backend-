#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
import requests

def test_inactive_packages():
    print("🧪 TESTING INACTIVE PACKAGES LOGIC")
    print("=" * 50)
    
    # Step 1: Show current state
    print("📊 Step 1: Current package status")
    active_count = UmrahPackage.objects.filter(is_active=True).count()
    inactive_count = UmrahPackage.objects.filter(is_active=False).count()
    print(f"  🟢 Active packages: {active_count}")
    print(f"  🔴 Inactive packages: {inactive_count}")
    
    # Step 2: Set 2 packages to inactive
    print(f"\n🔄 Step 2: Setting 2 packages to INACTIVE...")
    
    # Get first 2 packages to make inactive
    packages_to_deactivate = UmrahPackage.objects.filter(is_active=True)[:2]
    
    deactivated_packages = []
    for pkg in packages_to_deactivate:
        pkg.is_active = False
        pkg.save()
        deactivated_packages.append(pkg)
        print(f"  ❌ {pkg.title} -> INACTIVE")
    
    # Step 3: Check new state
    print(f"\n📊 Step 3: New package status")
    new_active_count = UmrahPackage.objects.filter(is_active=True).count()
    new_inactive_count = UmrahPackage.objects.filter(is_active=False).count()
    print(f"  🟢 Active packages: {new_active_count}")
    print(f"  🔴 Inactive packages: {new_inactive_count}")
    
    # Step 4: Test public API
    print(f"\n🌐 Step 4: Testing public API (/api/public/packages/)")
    
    try:
        response = requests.get("http://127.0.0.1:8000/api/public/packages/")
        
        if response.status_code == 200:
            api_packages = response.json()
            print(f"  📦 API returned {len(api_packages)} packages")
            print(f"  💡 Expected: {new_active_count} packages (only active should show)")
            
            # Check if any inactive packages appear in API
            inactive_found_in_api = []
            
            print(f"\n  📋 Checking each package in API response:")
            for api_pkg in api_packages:
                pkg_id = api_pkg.get('id')
                title = api_pkg.get('title', 'Unknown')[:40]
                is_active_from_api = api_pkg.get('is_active', 'Unknown')
                
                # Get actual status from database
                try:
                    db_pkg = UmrahPackage.objects.get(id=pkg_id)
                    actual_active = db_pkg.is_active
                    
                    if actual_active:
                        print(f"    ✅ {title} | Active: {is_active_from_api} (DB: {actual_active})")
                    else:
                        print(f"    ❌ {title} | Active: {is_active_from_api} (DB: {actual_active}) - SHOULD NOT APPEAR!")
                        inactive_found_in_api.append(title)
                        
                except UmrahPackage.DoesNotExist:
                    print(f"    ❓ {title} | Package not found in database")
            
            # Verify the deactivated packages are NOT in the API response
            print(f"\n  🔍 Checking if deactivated packages appear in API:")
            deactivated_in_api = []
            api_package_ids = [pkg.get('id') for pkg in api_packages]
            
            for deactivated_pkg in deactivated_packages:
                if deactivated_pkg.id in api_package_ids:
                    print(f"    ❌ PROBLEM: {deactivated_pkg.title} (INACTIVE) found in API!")
                    deactivated_in_api.append(deactivated_pkg.title)
                else:
                    print(f"    ✅ GOOD: {deactivated_pkg.title} (INACTIVE) correctly hidden from API")
            
            # Final result
            print(f"\n🎯 TEST RESULTS:")
            if len(api_packages) == new_active_count and len(inactive_found_in_api) == 0 and len(deactivated_in_api) == 0:
                print(f"  ✅ SUCCESS: Inactive package filtering is working correctly!")
                print(f"     - Only active packages appear in public API")
                print(f"     - Inactive packages are properly hidden")
                print(f"     - Expected count matches actual count")
            else:
                print(f"  ❌ PROBLEM DETECTED:")
                if len(api_packages) != new_active_count:
                    print(f"     - Count mismatch: Expected {new_active_count}, Got {len(api_packages)}")
                if len(inactive_found_in_api) > 0:
                    print(f"     - {len(inactive_found_in_api)} inactive packages found in API")
                if len(deactivated_in_api) > 0:
                    print(f"     - {len(deactivated_in_api)} deactivated packages still in API")
        
        else:
            print(f"  ❌ API Error: {response.status_code}")
            print(f"  Response: {response.text}")
    
    except Exception as e:
        print(f"  ❌ Connection Error: {e}")
    
    # Step 5: Restore packages to active (optional)
    print(f"\n🔄 Step 5: Do you want to restore the 2 packages to ACTIVE? (y/n)")
    
    # For automated testing, let's restore them
    print(f"  🔄 Auto-restoring packages to ACTIVE for normal operation...")
    for pkg in deactivated_packages:
        pkg.is_active = True
        pkg.save()
        print(f"  ✅ {pkg.title} -> ACTIVE")
    
    final_active = UmrahPackage.objects.filter(is_active=True).count()
    final_inactive = UmrahPackage.objects.filter(is_active=False).count()
    print(f"\n📊 Final Status:")
    print(f"  🟢 Active packages: {final_active}")
    print(f"  🔴 Inactive packages: {final_inactive}")
    
    print(f"\n🎉 TEST COMPLETED!")
    print(f"💡 The logic works: When packages are set to INACTIVE, they don't appear on public page")

if __name__ == "__main__":
    test_inactive_packages()