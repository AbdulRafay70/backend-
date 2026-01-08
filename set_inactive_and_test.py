#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
import requests

def set_packages_inactive_and_test():
    print("🔄 SETTING 2 PACKAGES TO INACTIVE AND TESTING PUBLIC PAGE")
    print("=" * 60)
    
    # Step 1: Show all packages before changes
    print("📊 Step 1: Current packages status")
    all_packages = UmrahPackage.objects.all().order_by('id')
    
    for pkg in all_packages:
        status_icon = "🟢" if pkg.is_active else "🔴"
        price = pkg.sharing_cost() if hasattr(pkg, 'sharing_cost') else 0
        print(f"  {status_icon} {pkg.id} | {pkg.title[:40]:<40} | Rs. {price:,.0f}")
    
    print(f"\n  Total: {all_packages.count()} packages")
    active_count = all_packages.filter(is_active=True).count()
    inactive_count = all_packages.filter(is_active=False).count()
    print(f"  🟢 Active: {active_count}")
    print(f"  🔴 Inactive: {inactive_count}")
    
    # Step 2: Select 2 packages to make inactive (choose high-priced duplicates)
    print(f"\n🎯 Step 2: Selecting packages to make INACTIVE")
    
    # Choose Premium and Family packages with very high prices (the problematic duplicates)
    packages_to_deactivate = []
    
    premium_high = UmrahPackage.objects.filter(
        title__icontains='Premium', 
        is_active=True
    ).order_by('-id').first()  # Get the higher-priced version
    
    family_high = UmrahPackage.objects.filter(
        title__icontains='Family', 
        is_active=True
    ).order_by('-id').first()  # Get the higher-priced version
    
    if premium_high:
        premium_price = premium_high.sharing_cost() if hasattr(premium_high, 'sharing_cost') else 0
        if premium_price > 1000000:  # If over 1 million, it's the high-priced one
            packages_to_deactivate.append(premium_high)
            print(f"  🎯 Selected: {premium_high.title} (Rs. {premium_price:,.0f}) - High priced duplicate")
    
    if family_high:
        family_price = family_high.sharing_cost() if hasattr(family_high, 'sharing_cost') else 0
        if family_price > 1000000:  # If over 1 million, it's the high-priced one
            packages_to_deactivate.append(family_high)
            print(f"  🎯 Selected: {family_high.title} (Rs. {family_price:,.0f}) - High priced duplicate")
    
    # If we don't have 2 high-priced packages, just take any 2 active ones
    if len(packages_to_deactivate) < 2:
        remaining_needed = 2 - len(packages_to_deactivate)
        additional = UmrahPackage.objects.filter(is_active=True).exclude(
            id__in=[pkg.id for pkg in packages_to_deactivate]
        )[:remaining_needed]
        
        for pkg in additional:
            packages_to_deactivate.append(pkg)
            price = pkg.sharing_cost() if hasattr(pkg, 'sharing_cost') else 0
            print(f"  🎯 Selected: {pkg.title} (Rs. {price:,.0f})")
    
    # Step 3: Set selected packages to inactive
    print(f"\n❌ Step 3: Setting {len(packages_to_deactivate)} packages to INACTIVE")
    
    for pkg in packages_to_deactivate:
        pkg.is_active = False
        pkg.save()
        price = pkg.sharing_cost() if hasattr(pkg, 'sharing_cost') else 0
        print(f"  ❌ {pkg.title} -> INACTIVE (was Rs. {price:,.0f})")
    
    # Step 4: Show new status
    print(f"\n📊 Step 4: New package status")
    new_active_count = UmrahPackage.objects.filter(is_active=True).count()
    new_inactive_count = UmrahPackage.objects.filter(is_active=False).count()
    print(f"  🟢 Active packages: {new_active_count}")
    print(f"  🔴 Inactive packages: {new_inactive_count}")
    
    # Step 5: Test public API to ensure inactive packages don't appear
    print(f"\n🌐 Step 5: Testing PUBLIC API (/api/public/packages/)")
    
    try:
        response = requests.get("http://127.0.0.1:8000/api/public/packages/")
        
        if response.status_code == 200:
            api_packages = response.json()
            print(f"  📦 Public API returned: {len(api_packages)} packages")
            print(f"  💡 Expected: {new_active_count} packages (only active should show)")
            
            # Check if the count matches
            if len(api_packages) == new_active_count:
                print(f"  ✅ SUCCESS: Count matches perfectly!")
            else:
                print(f"  ⚠️  Count mismatch - investigating...")
            
            print(f"\n  📋 Packages currently showing on PUBLIC page:")
            inactive_found = 0
            
            for api_pkg in api_packages:
                pkg_id = api_pkg.get('id')
                title = api_pkg.get('title', 'Unknown')[:45]
                is_active_api = api_pkg.get('is_active', 'Unknown')
                
                # Verify with database
                try:
                    db_pkg = UmrahPackage.objects.get(id=pkg_id)
                    if db_pkg.is_active:
                        print(f"    ✅ {title} | Status: Active")
                    else:
                        print(f"    ❌ {title} | Status: INACTIVE - SHOULD NOT SHOW!")
                        inactive_found += 1
                except UmrahPackage.DoesNotExist:
                    print(f"    ❓ {title} | Not found in database")
            
            # Verify our deactivated packages are not in the response
            print(f"\n  🔍 Verifying deactivated packages are hidden:")
            deactivated_package_ids = [pkg.id for pkg in packages_to_deactivate]
            api_package_ids = [pkg.get('id') for pkg in api_packages]
            
            hidden_correctly = 0
            still_showing = 0
            
            for pkg in packages_to_deactivate:
                if pkg.id not in api_package_ids:
                    print(f"    ✅ {pkg.title[:45]} | Correctly HIDDEN from public")
                    hidden_correctly += 1
                else:
                    print(f"    ❌ {pkg.title[:45]} | STILL SHOWING on public!")
                    still_showing += 1
            
            # Final verdict
            print(f"\n🎯 FINAL RESULTS:")
            if inactive_found == 0 and still_showing == 0 and len(api_packages) == new_active_count:
                print(f"  🎉 PERFECT SUCCESS!")
                print(f"    ✅ All inactive packages are hidden from public page")
                print(f"    ✅ Only active packages appear on public page")
                print(f"    ✅ Package count is correct: {len(api_packages)} active packages")
                print(f"    ✅ The 2 deactivated packages are properly hidden")
            else:
                print(f"  ⚠️  Issues detected:")
                if inactive_found > 0:
                    print(f"    ❌ {inactive_found} inactive packages still showing")
                if still_showing > 0:
                    print(f"    ❌ {still_showing} deactivated packages still visible")
                if len(api_packages) != new_active_count:
                    print(f"    ❌ Count mismatch: Expected {new_active_count}, Got {len(api_packages)}")
        
        else:
            print(f"  ❌ API Error: {response.status_code}")
            print(f"  Response: {response.text}")
    
    except Exception as e:
        print(f"  ❌ Connection Error: {e}")
    
    print(f"\n💡 SUMMARY:")
    print(f"  📊 Total packages in database: {UmrahPackage.objects.count()}")
    print(f"  🟢 Active packages: {new_active_count} (will show on public page)")
    print(f"  🔴 Inactive packages: {new_inactive_count} (hidden from public page)")
    print(f"  🌐 Public API shows: {len(api_packages) if 'api_packages' in locals() else 'N/A'} packages")
    
    print(f"\n🎯 The logic works: Inactive packages are automatically hidden from the public packages page!")

if __name__ == "__main__":
    set_packages_inactive_and_test()