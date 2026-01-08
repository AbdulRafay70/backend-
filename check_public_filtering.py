#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

def check_public_package_filtering():
    print("🔍 Checking Public Package Filtering Issue...")
    print("=" * 60)
    
    # Get all packages
    all_packages = UmrahPackage.objects.all()
    print(f"📦 Total Packages: {all_packages.count()}")
    
    # Check active vs inactive
    active_packages = all_packages.filter(is_active=True)
    inactive_packages = all_packages.filter(is_active=False)
    
    print(f"🟢 Active Packages: {active_packages.count()}")
    print(f"🔴 Inactive Packages: {inactive_packages.count()}")
    
    # Check public vs private
    public_packages = all_packages.filter(is_public=True)
    private_packages = all_packages.filter(is_public=False)
    
    print(f"🌐 Public Packages: {public_packages.count()}")
    print(f"🔒 Private Packages: {private_packages.count()}")
    
    # Check the combination (what should appear on public page)
    public_active = all_packages.filter(is_active=True, is_public=True)
    print(f"✅ Public + Active (should show on public page): {public_active.count()}")
    
    # Check what shouldn't appear
    inactive_public = all_packages.filter(is_active=False, is_public=True)
    print(f"❌ Inactive + Public (shouldn't show on public page): {inactive_public.count()}")
    
    print(f"\n📋 Package Status Breakdown:")
    for pkg in all_packages.order_by('id'):
        status_icon = "🟢" if pkg.is_active else "🔴"
        public_icon = "🌐" if pkg.is_public else "🔒"
        should_show = "✅ SHOW" if (pkg.is_active and pkg.is_public) else "❌ HIDE"
        
        print(f"  {status_icon} {public_icon} {pkg.title[:30]:<30} | {should_show}")
    
    # The issue might be that packages are not set to is_public=True
    # Let's check if we need to set public status
    need_public_fix = all_packages.filter(is_active=True, is_public=False)
    if need_public_fix.exists():
        print(f"\n🔧 ISSUE FOUND: {need_public_fix.count()} active packages are not public!")
        print("💡 These packages are active but won't show on public page because is_public=False")
        
        for pkg in need_public_fix:
            print(f"  🔴 {pkg.title} - Active: {pkg.is_active}, Public: {pkg.is_public}")
        
        # Fix: Set active packages to public
        choice = input(f"\n❓ Fix by setting all active packages to public? (y/n): ")
        if choice.lower() == 'y':
            updated_count = need_public_fix.update(is_public=True)
            print(f"✅ Updated {updated_count} packages to is_public=True")
            
            # Re-check
            public_active_after = UmrahPackage.objects.filter(is_active=True, is_public=True)
            print(f"🎉 Now {public_active_after.count()} packages will show on public page")
    else:
        print(f"\n✅ All active packages are correctly set to public")

if __name__ == "__main__":
    check_public_package_filtering()