#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
import requests

def comprehensive_public_filtering_test():
    print("🧪 COMPREHENSIVE PUBLIC PACKAGE FILTERING TEST")
    print("=" * 60)
    
    # Step 1: Create test scenario
    print("📝 Step 1: Setting up test scenario...")
    
    packages = UmrahPackage.objects.all()[:4]  # Get 4 packages for testing
    test_configs = [
        {'active': True, 'public': True, 'should_show': True, 'label': 'ACTIVE + PUBLIC'},
        {'active': True, 'public': False, 'should_show': False, 'label': 'ACTIVE + PRIVATE'},
        {'active': False, 'public': True, 'should_show': False, 'label': 'INACTIVE + PUBLIC'},
        {'active': False, 'public': False, 'should_show': False, 'label': 'INACTIVE + PRIVATE'},
    ]
    
    for i, pkg in enumerate(packages[:len(test_configs)]):
        config = test_configs[i]
        pkg.is_active = config['active']
        pkg.is_public = config['public']
        pkg.save()
        
        print(f"  📦 {pkg.title[:30]:<30} -> {config['label']:<20} (Should Show: {config['should_show']})")
    
    # Step 2: Check database state
    print(f"\n📊 Step 2: Database state:")
    all_packages = UmrahPackage.objects.all()
    active_public = all_packages.filter(is_active=True, is_public=True).count()
    active_private = all_packages.filter(is_active=True, is_public=False).count()
    inactive_public = all_packages.filter(is_active=False, is_public=True).count()
    inactive_private = all_packages.filter(is_active=False, is_public=False).count()
    
    print(f"  ✅ Active + Public: {active_public} (should show on public API)")
    print(f"  🔒 Active + Private: {active_private} (should NOT show)")
    print(f"  ❌ Inactive + Public: {inactive_public} (should NOT show)")
    print(f"  🔒 Inactive + Private: {inactive_private} (should NOT show)")
    
    # Step 3: Test the public API
    print(f"\n🌐 Step 3: Testing public API endpoint...")
    
    try:
        response = requests.get("http://127.0.0.1:8000/api/public/packages/")
        
        if response.status_code == 200:
            api_packages = response.json()
            print(f"  📦 API returned {len(api_packages)} packages")
            print(f"  💡 Expected: {active_public} packages (only active + public should show)")
            
            # Check if the count matches expectations
            if len(api_packages) == active_public:
                print(f"  ✅ SUCCESS: API correctly shows only active + public packages")
            else:
                print(f"  ❌ PROBLEM: API count mismatch!")
                print(f"     Expected: {active_public}, Got: {len(api_packages)}")
                
                # Check what packages are in the response
                print(f"\n  📋 Packages in API response:")
                for pkg in api_packages:
                    pkg_id = pkg.get('id')
                    title = pkg.get('title', 'Unknown')[:30]
                    
                    # Look up the actual package in database
                    try:
                        db_pkg = UmrahPackage.objects.get(id=pkg_id)
                        status = f"Active: {db_pkg.is_active}, Public: {db_pkg.is_public}"
                        should_show = db_pkg.is_active and db_pkg.is_public
                        icon = "✅" if should_show else "❌"
                        print(f"    {icon} {title} | {status} | Should show: {should_show}")
                    except UmrahPackage.DoesNotExist:
                        print(f"    ❓ {title} | Package not found in DB")
            
            # Additional check: verify no inactive packages are in response
            inactive_in_api = 0
            for pkg in api_packages:
                try:
                    db_pkg = UmrahPackage.objects.get(id=pkg.get('id'))
                    if not db_pkg.is_active:
                        inactive_in_api += 1
                        print(f"    ⚠️  INACTIVE package found in API: {db_pkg.title}")
                except:
                    pass
            
            if inactive_in_api == 0:
                print(f"  ✅ No inactive packages found in API response")
            else:
                print(f"  ❌ CRITICAL: {inactive_in_api} inactive packages found in API!")
        
        else:
            print(f"  ❌ API Error: {response.status_code}")
            print(f"  Response: {response.text}")
    
    except Exception as e:
        print(f"  ❌ Connection Error: {e}")
    
    # Step 4: Reset all packages to active/public for normal operation
    print(f"\n🔄 Step 4: Resetting all packages to ACTIVE + PUBLIC...")
    reset_count = UmrahPackage.objects.update(is_active=True, is_public=True)
    print(f"  ✅ Reset {reset_count} packages")
    
    print(f"\n🎯 TEST COMPLETED!")
    print(f"💡 If test shows problems, the issue is in the public API filtering logic")
    print(f"📍 Expected behavior: Only packages with is_active=True AND is_public=True should appear")

if __name__ == "__main__":
    comprehensive_public_filtering_test()