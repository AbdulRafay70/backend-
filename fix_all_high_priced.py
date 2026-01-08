#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
import requests

def fix_all_high_priced_packages():
    print("🔧 FIXING ALL HIGH-PRICED DUPLICATE PACKAGES")
    print("=" * 60)
    
    # Step 1: Find all active packages and identify the problematic ones
    print("📊 Step 1: Analyzing all packages...")
    
    all_packages = UmrahPackage.objects.filter(is_active=True).order_by('title', 'id')
    
    # Group packages by title to find duplicates
    package_groups = {}
    for pkg in all_packages:
        title_base = pkg.title.strip()
        if title_base not in package_groups:
            package_groups[title_base] = []
        package_groups[title_base].append(pkg)
    
    print(f"  Found {len(package_groups)} unique package titles")
    
    # Step 2: Identify high-priced duplicates to deactivate
    packages_to_deactivate = []
    
    print(f"\n🔍 Step 2: Identifying high-priced duplicates...")
    
    for title, packages in package_groups.items():
        if len(packages) > 1:
            print(f"\n  📦 {title}:")
            prices = []
            
            for pkg in packages:
                try:
                    price = pkg.sharing_cost()
                    prices.append((pkg, price))
                    print(f"    ID {pkg.id}: Rs. {price:,.0f}")
                except:
                    prices.append((pkg, 0))
                    print(f"    ID {pkg.id}: Rs. 0 (calculation error)")
            
            # If we have duplicates, keep the one with reasonable price (under 500k)
            # and deactivate the high-priced ones (over 500k)
            reasonable_packages = [(pkg, price) for pkg, price in prices if price < 500000]
            high_priced_packages = [(pkg, price) for pkg, price in prices if price >= 500000]
            
            if reasonable_packages and high_priced_packages:
                # Keep the reasonable one, deactivate the high-priced ones
                keep_pkg, keep_price = reasonable_packages[0]
                print(f"    ✅ KEEP: ID {keep_pkg.id} (Rs. {keep_price:,.0f}) - Reasonable price")
                
                for pkg, price in high_priced_packages:
                    packages_to_deactivate.append(pkg)
                    print(f"    ❌ DEACTIVATE: ID {pkg.id} (Rs. {price:,.0f}) - Too expensive")
            
            elif len(high_priced_packages) > 1:
                # All are high-priced, keep the cheapest one
                high_priced_packages.sort(key=lambda x: x[1])
                keep_pkg, keep_price = high_priced_packages[0]
                print(f"    ✅ KEEP: ID {keep_pkg.id} (Rs. {keep_price:,.0f}) - Cheapest of high-priced")
                
                for pkg, price in high_priced_packages[1:]:
                    packages_to_deactivate.append(pkg)
                    print(f"    ❌ DEACTIVATE: ID {pkg.id} (Rs. {price:,.0f}) - More expensive duplicate")
    
    # Step 3: Deactivate the problematic packages
    print(f"\n❌ Step 3: Deactivating {len(packages_to_deactivate)} problematic packages...")
    
    if packages_to_deactivate:
        for pkg in packages_to_deactivate:
            pkg.is_active = False
            pkg.save()
            try:
                price = pkg.sharing_cost()
                print(f"  ❌ {pkg.title} (ID: {pkg.id}) -> INACTIVE (Rs. {price:,.0f})")
            except:
                print(f"  ❌ {pkg.title} (ID: {pkg.id}) -> INACTIVE")
    else:
        print("  ✅ No problematic packages found!")
    
    # Step 4: Check final status
    print(f"\n📊 Step 4: Final package status...")
    final_active = UmrahPackage.objects.filter(is_active=True).count()
    final_inactive = UmrahPackage.objects.filter(is_active=False).count()
    print(f"  🟢 Active packages: {final_active}")
    print(f"  🔴 Inactive packages: {final_inactive}")
    
    # Step 5: Test public API
    print(f"\n🌐 Step 5: Testing PUBLIC API...")
    
    try:
        response = requests.get("http://127.0.0.1:8000/api/public/packages/")
        
        if response.status_code == 200:
            api_packages = response.json()
            print(f"  📦 Public API now shows: {len(api_packages)} packages")
            
            print(f"\n  📋 Packages on public page (with prices):")
            
            reasonable_count = 0
            high_priced_count = 0
            
            for api_pkg in api_packages:
                pkg_id = api_pkg.get('id')
                title = api_pkg.get('title', 'Unknown')[:40]
                
                try:
                    db_pkg = UmrahPackage.objects.get(id=pkg_id)
                    price = db_pkg.sharing_cost()
                    
                    if price < 500000:
                        print(f"    ✅ {title:<40} | Rs. {price:,.0f}")
                        reasonable_count += 1
                    else:
                        print(f"    ⚠️  {title:<40} | Rs. {price:,.0f} - HIGH PRICED!")
                        high_priced_count += 1
                        
                except Exception as e:
                    print(f"    ❓ {title:<40} | Price calculation error")
            
            print(f"\n  📊 Price Analysis:")
            print(f"    ✅ Reasonable priced (< Rs. 500k): {reasonable_count}")
            print(f"    ⚠️  High priced (≥ Rs. 500k): {high_priced_count}")
            
            if high_priced_count == 0:
                print(f"\n  🎉 SUCCESS: All high-priced packages are now hidden!")
                print(f"  ✅ Public page shows only reasonably priced packages")
            else:
                print(f"\n  ⚠️  Still {high_priced_count} high-priced packages showing")
                print(f"  💡 You may need to manually review these in admin")
        
        else:
            print(f"  ❌ API Error: {response.status_code}")
    
    except Exception as e:
        print(f"  ❌ Connection Error: {e}")
    
    print(f"\n🎯 SUMMARY:")
    print(f"  📊 Deactivated {len(packages_to_deactivate)} high-priced duplicate packages")
    print(f"  🟢 {final_active} packages remain active (showing on public)")
    print(f"  🔴 {final_inactive} packages are inactive (hidden from public)")
    print(f"  💡 Public page should now show only reasonable-priced packages!")

if __name__ == "__main__":
    fix_all_high_priced_packages()