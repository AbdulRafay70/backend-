#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

def fix_vip_package():
    print("🔧 Fixing VIP Package Issues...")
    print("=" * 50)
    
    # Find the VIP package
    vip_package = UmrahPackage.objects.filter(title__icontains='VIP').first()
    if not vip_package:
        print('❌ VIP package not found')
        return
    
    print(f"📦 Found: {vip_package.title}")
    
    # Issue 1: Set package to ACTIVE
    print(f"🔄 Current Status: {'ACTIVE' if vip_package.is_active else 'INACTIVE'}")
    if not vip_package.is_active:
        vip_package.is_active = True
        print("✅ Setting package to ACTIVE")
    
    # Issue 2: Fix the extremely high pricing
    print(f"💰 Current Sharing Cost: Rs. {vip_package.sharing_cost():,.2f}")
    
    # The pricing issue seems to be coming from the cost calculation method
    # Let's check if there are hotel details with incorrect pricing
    
    print("\n🏨 Checking Hotel Details:")
    for hotel_detail in vip_package.hotel_details.all():
        print(f"  Hotel: {hotel_detail.hotel.name}")
        print(f"  Nights: {hotel_detail.number_of_nights}")
        print(f"  Sharing Selling Price: Rs. {hotel_detail.sharing_bed_selling_price:,.2f}")
        print(f"  Quint Selling Price: Rs. {hotel_detail.quaint_bed_selling_price:,.2f}")
        print(f"  Quad Selling Price: Rs. {hotel_detail.quad_bed_selling_price:,.2f}")
        print(f"  Triple Selling Price: Rs. {hotel_detail.triple_bed_selling_price:,.2f}")
        print(f"  Double Selling Price: Rs. {hotel_detail.double_bed_selling_price:,.2f}")
        
        # If prices are too high, set reasonable ones
        if hotel_detail.sharing_bed_selling_price > 100000:  # Over 100k is too high
            print("  🔧 Fixing high hotel room prices...")
            hotel_detail.sharing_bed_selling_price = 5000  # Rs. 5k per night
            hotel_detail.quaint_bed_selling_price = 7500   # Rs. 7.5k per night  
            hotel_detail.quad_bed_selling_price = 6000     # Rs. 6k per night
            hotel_detail.triple_bed_selling_price = 6500   # Rs. 6.5k per night
            hotel_detail.double_bed_selling_price = 8000   # Rs. 8k per night
            hotel_detail.save()
            print(f"  ✅ Set sharing to Rs. {hotel_detail.sharing_bed_selling_price}/night")
            print(f"  ✅ Set quint to Rs. {hotel_detail.quaint_bed_selling_price}/night")
            print(f"  ✅ Set quad to Rs. {hotel_detail.quad_bed_selling_price}/night")
            print(f"  ✅ Set triple to Rs. {hotel_detail.triple_bed_selling_price}/night")
            print(f"  ✅ Set double to Rs. {hotel_detail.double_bed_selling_price}/night")
    
    # Save the package
    vip_package.save()
    
    print(f"\n🎉 FIXED! New Status: {'ACTIVE' if vip_package.is_active else 'INACTIVE'}")
    print("📊 New Room Pricing:")
    print(f"  Sharing: Rs. {vip_package.sharing_cost():,.2f}")
    print(f"  Quint: Rs. {vip_package.quint_cost():,.2f}")
    print(f"  Quad: Rs. {vip_package.quad_cost():,.2f}")
    print(f"  Triple: Rs. {vip_package.triple_cost():,.2f}")
    print(f"  Double: Rs. {vip_package.double_cost():,.2f}")
    
    return vip_package

if __name__ == "__main__":
    fix_vip_package()