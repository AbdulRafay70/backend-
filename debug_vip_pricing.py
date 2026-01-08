#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

def debug_vip_pricing():
    print("🔍 Debugging VIP Package Pricing...")
    print("=" * 60)
    
    # Find the VIP package
    vip_package = UmrahPackage.objects.filter(title__icontains='VIP').first()
    if not vip_package:
        print('❌ VIP package not found')
        return
    
    print(f"📦 Package: {vip_package.title}")
    print(f"🎫 Duration: {vip_package.start_date} to {vip_package.end_date}")
    
    # Debug the cost calculation
    print("\n🧮 Cost Breakdown:")
    print(f"Adult Cost (base): Rs. {vip_package.adult_cost():,.2f}")
    
    # Check hotel details breakdown
    print(f"\n🏨 Hotel Details Count: {vip_package.hotel_details.count()}")
    total_hotel_cost = 0
    
    for i, hotel_detail in enumerate(vip_package.hotel_details.all(), 1):
        sharing_cost = hotel_detail.sharing_bed_selling_price * hotel_detail.number_of_nights
        total_hotel_cost += sharing_cost
        
        print(f"\n  Hotel {i}: {hotel_detail.hotel.name}")
        print(f"  📅 Nights: {hotel_detail.number_of_nights}")
        print(f"  💰 Sharing Rate: Rs. {hotel_detail.sharing_bed_selling_price:,.2f}/night")
        print(f"  📊 Total for this hotel: Rs. {sharing_cost:,.2f}")
    
    print(f"\n💰 Total Hotel Cost: Rs. {total_hotel_cost:,.2f}")
    
    # Show what adult_cost includes
    print(f"\n🔍 Adult Cost Components:")
    print(f"  Food: Rs. {vip_package.food_selling_price:,.2f}")
    print(f"  Makkah Ziyarat: Rs. {vip_package.makkah_ziyarat_selling_price:,.2f}")
    print(f"  Madinah Ziyarat: Rs. {vip_package.madinah_ziyarat_selling_price:,.2f}")
    print(f"  Transport: Rs. {vip_package.transport_selling_price:,.2f}")
    print(f"  Adult Visa: Rs. {vip_package.adault_visa_selling_price:,.2f}")
    
    # Check ticket pricing
    first_ticket = vip_package._first_ticket_obj()
    if first_ticket:
        print(f"  Ticket Adult: Rs. {getattr(first_ticket, 'adult_price', 0):,.2f}")
    
    # The issue is likely multiple hotel entries for 35 days
    # Let's fix this by setting a more reasonable structure
    if vip_package.hotel_details.count() > 2:  # More than Makkah + Madinah
        print("\n🔧 Problem: Too many hotel entries for 35-day package")
        print("💡 Solution: Should have ~10 days Makkah + ~10 days Madinah = ~20 total nights")
        
        # Update to reasonable night counts
        hotel_count = 0
        for hotel_detail in vip_package.hotel_details.all():
            hotel_count += 1
            if hotel_count <= 2:  # First two hotels (main stays)
                if 'makkah' in hotel_detail.hotel.name.lower() or 'burj' in hotel_detail.hotel.name.lower():
                    hotel_detail.number_of_nights = 10  # 10 nights in Makkah
                else:
                    hotel_detail.number_of_nights = 10  # 10 nights in Madinah
            else:
                # Remove extra hotel entries or set to 0
                hotel_detail.number_of_nights = 0
            
            hotel_detail.save()
            print(f"  ✅ Updated {hotel_detail.hotel.name}: {hotel_detail.number_of_nights} nights")
    
    print(f"\n🎉 Updated Room Pricing:")
    print(f"  Sharing: Rs. {vip_package.sharing_cost():,.2f}")
    print(f"  Quint: Rs. {vip_package.quint_cost():,.2f}")
    print(f"  Quad: Rs. {vip_package.quad_cost():,.2f}")
    print(f"  Triple: Rs. {vip_package.triple_cost():,.2f}")
    print(f"  Double: Rs. {vip_package.double_cost():,.2f}")

if __name__ == "__main__":
    debug_vip_pricing()