#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
import requests

def test_inactive_package_filtering():
    print("🧪 Testing Inactive Package Filtering on Public Page...")
    print("=" * 60)
    
    # Step 1: Set some packages to INACTIVE for testing
    test_packages = UmrahPackage.objects.all()[:2]  # Take first 2 packages
    
    print("📝 Setting test packages to INACTIVE:")
    for pkg in test_packages:
        pkg.is_active = False
        pkg.save()
        print(f"  ❌ {pkg.title} -> INACTIVE")
    
    # Step 2: Check database state
    active_count = UmrahPackage.objects.filter(is_active=True).count()
    inactive_count = UmrahPackage.objects.filter(is_active=False).count()
    
    print(f"\n📊 Current Database State:")
    print(f"  🟢 Active Packages: {active_count}")
    print(f"  🔴 Inactive Packages: {inactive_count}")
    
    # Step 3: Test the public API endpoint
    public_api_url = "http://127.0.0.1:8000/api/public/packages/"
    
    print(f"\n🌐 Testing Public API: {public_api_url}")
    try:
        response = requests.get(public_api_url)
        if response.status_code == 200:
            public_packages = response.json()
            print(f"  📦 API returned {len(public_packages)} packages")
            
            print(f"  📋 Packages returned by public API:")
            for pkg in public_packages:
                title = pkg.get('title', 'Unknown')[:30]
                is_active = pkg.get('is_active', 'Unknown')
                print(f"    {'🟢' if is_active else '🔴'} {title} (Active: {is_active})")
            
            # Check if any inactive packages are in the response
            inactive_in_response = [p for p in public_packages if not p.get('is_active', True)]
            if inactive_in_response:
                print(f"\n❌ PROBLEM FOUND: {len(inactive_in_response)} inactive packages in public API!")
                for pkg in inactive_in_response:
                    print(f"    🔴 {pkg.get('title', 'Unknown')} should NOT appear on public page")
            else:
                print(f"\n✅ GOOD: No inactive packages in public API response")
                
        else:
            print(f"  ❌ API Error: {response.status_code}")
            print(f"  Response: {response.text}")
    
    except Exception as e:
        print(f"  ❌ Connection Error: {e}")
    
    # Step 4: Check the actual view code to see if filtering is correct
    print(f"\n🔍 Now let me check the PublicUmrahPackageListAPIView filtering logic...")
    
    # Step 5: Reset packages to ACTIVE for normal operation
    print(f"\n🔄 Resetting test packages to ACTIVE...")
    for pkg in test_packages:
        pkg.is_active = True
        pkg.save()
        print(f"  ✅ {pkg.title} -> ACTIVE")
    
    print(f"\n🎯 TEST COMPLETE!")

if __name__ == "__main__":
    test_inactive_package_filtering()