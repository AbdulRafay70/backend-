#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

def fix_remaining_pricing():
    print("🔧 Final VIP Package Pricing Fix...")
    print("=" * 50)
    
    # Find the VIP package
    vip_package = UmrahPackage.objects.filter(title__icontains='VIP').first()
    if not vip_package:
        print('❌ VIP package not found')
        return
    
    print(f"📦 Package: {vip_package.title}")
    
    # Fix any remaining high rates
    for hotel_detail in vip_package.hotel_details.all():
        if hotel_detail.number_of_nights > 0:  # Only active hotels
            print(f"\n🏨 {hotel_detail.hotel.name} ({hotel_detail.number_of_nights} nights)")
            
            # Set reasonable VIP hotel rates (5-star luxury but not extreme)
            if hotel_detail.sharing_bed_selling_price > 10000:  # Over 10k is too high
                print(f"  🔧 Fixing high rate: Rs. {hotel_detail.sharing_bed_selling_price:,.2f}/night")
                
                # Set VIP rates (higher than standard but reasonable)
                hotel_detail.sharing_bed_selling_price = 6000   # Rs. 6k/night sharing
                hotel_detail.quaint_bed_selling_price = 9000    # Rs. 9k/night quint
                hotel_detail.quad_bed_selling_price = 7500      # Rs. 7.5k/night quad  
                hotel_detail.triple_bed_selling_price = 8000    # Rs. 8k/night triple
                hotel_detail.double_bed_selling_price = 10000   # Rs. 10k/night double
                hotel_detail.save()
                
                print(f"  ✅ Set sharing: Rs. {hotel_detail.sharing_bed_selling_price:,.2f}/night")
                print(f"  ✅ Set quint: Rs. {hotel_detail.quaint_bed_selling_price:,.2f}/night")
                print(f"  ✅ Set quad: Rs. {hotel_detail.quad_bed_selling_price:,.2f}/night")
                print(f"  ✅ Set triple: Rs. {hotel_detail.triple_bed_selling_price:,.2f}/night")
                print(f"  ✅ Set double: Rs. {hotel_detail.double_bed_selling_price:,.2f}/night")
    
    print(f"\n🎉 FINAL VIP PACKAGE PRICING:")
    print(f"  🔄 Status: {'ACTIVE' if vip_package.is_active else 'INACTIVE'}")
    print(f"  🛏️  Sharing: Rs. {vip_package.sharing_cost():,.2f}")
    print(f"  🏨 Quint: Rs. {vip_package.quint_cost():,.2f}")
    print(f"  🛏️  Quad: Rs. {vip_package.quad_cost():,.2f}")
    print(f"  🏨 Triple: Rs. {vip_package.triple_cost():,.2f}")
    print(f"  💑 Double: Rs. {vip_package.double_cost():,.2f}")
    print(f"  👶 Infant: Rs. {vip_package.infant_price():,.2f}")
    print(f"  🎫 Seats Available: {vip_package.left_seats}/{vip_package.total_seats}")
    
    # These should now be reasonable VIP prices around Rs. 90-120k range

if __name__ == "__main__":
    fix_remaining_pricing()