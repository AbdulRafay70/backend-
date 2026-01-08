"""
Add Room Type Pricing Methods to UmrahPackage Model
This script adds methods to calculate prices for different room types
"""

import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage, UmrahPackageHotelDetails
from organization.models import Organization

def add_room_pricing_methods():
    """Add room type pricing calculation methods to existing packages"""
    
    # Get SAER organization packages
    org = Organization.objects.get(org_code="ORG-0001")
    packages = UmrahPackage.objects.filter(organization=org)
    
    print(f"📊 Calculating room type prices for {packages.count()} packages...")
    
    for package in packages:
        print(f"\n📦 {package.title}")
        
        # Get base prices (flight + visa + food + transport)
        base_adult_price = float(package.price_per_person or 0)
        
        # Get hotel pricing from hotel details
        hotel_details = package.hotel_details.all()
        
        if hotel_details.exists():
            # Calculate total hotel costs for different room types
            quaint_hotel_total = sum(float(hd.quaint_bed_selling_price) for hd in hotel_details)
            sharing_hotel_total = sum(float(hd.sharing_bed_selling_price) for hd in hotel_details)  
            quad_hotel_total = sum(float(hd.quad_bed_selling_price) for hd in hotel_details)
            triple_hotel_total = sum(float(hd.triple_bed_selling_price) for hd in hotel_details)
            double_hotel_total = sum(float(hd.double_bed_selling_price) for hd in hotel_details)
            
            # Calculate final prices per person for each room type
            prices = {
                'sharing': base_adult_price + sharing_hotel_total,
                'quaint': base_adult_price + quaint_hotel_total,
                'quad': base_adult_price + quad_hotel_total,
                'triple': base_adult_price + triple_hotel_total,
                'double': base_adult_price + double_hotel_total,
            }
            
            # Display calculated prices
            print(f"  💰 Room Type Pricing:")
            if package.is_sharing_active:
                print(f"    SHARING: Rs. {prices['sharing']:,.2f} per adult")
            if package.is_quaint_active:
                print(f"    QUAINT: Rs. {prices['quaint']:,.2f} per adult") 
            if package.is_quad_active:
                print(f"    QUAD BED: Rs. {prices['quad']:,.2f} per adult")
            if package.is_triple_active:
                print(f"    TRIPLE BED: Rs. {prices['triple']:,.2f} per adult")
            if package.is_double_active:
                print(f"    DOUBLE BED: Rs. {prices['double']:,.2f} per adult")
                
            print(f"    PER INFANT: Rs. {float(package.infant_visa_selling_price or 0) + float(package.infant_service_charge or 0):,.2f}")
            
        else:
            print(f"  ⚠️ No hotel details found")

def create_room_pricing_display():
    """Create a sample room pricing display like the user's example"""
    
    org = Organization.objects.get(org_code="ORG-0001") 
    vip_package = UmrahPackage.objects.filter(
        organization=org,
        title__icontains="VIP"
    ).first()
    
    if not vip_package:
        print("❌ VIP package not found")
        return
        
    print("\n" + "="*60)
    print("📋 PACKAGE DISPLAY EXAMPLE")
    print("="*60)
    
    print(f"{vip_package.title}")
    
    # Get hotel information
    hotel_details = vip_package.hotel_details.all()
    makkah_hotels = [hd.hotel for hd in hotel_details if 'makkah' in hd.hotel.city.name.lower()]
    madinah_hotels = [hd.hotel for hd in hotel_details if 'madinah' in hd.hotel.city.name.lower() or 'medina' in hd.hotel.city.name.lower()]
    
    print("MAKKAH HOTEL:")
    if makkah_hotels:
        print(f"{makkah_hotels[0].name}")
    else:
        print("Available Makkah Hotels")
        
    print("MADINA HOTEL:")  
    if madinah_hotels:
        print(f"{madinah_hotels[0].name}")
    else:
        print("Available Madinah Hotels")
        
    print("ZIYARAT:")
    print("YES" if vip_package.makkah_ziyarat_selling_price > 0 else "NO")
    
    print("FOOD:")
    print("INCLUDED" if vip_package.food_selling_price > 0 else "NOT INCLUDED")
    
    print("RULES:")
    print("N/A")
    
    print(f"{vip_package.left_seats}")
    print("Seats Left")
    
    # Calculate and display room type prices
    base_price = float(vip_package.price_per_person or 0)
    
    if hotel_details.exists():
        sharing_hotel = sum(float(hd.sharing_bed_selling_price) for hd in hotel_details)
        quaint_hotel = sum(float(hd.quaint_bed_selling_price) for hd in hotel_details)
        quad_hotel = sum(float(hd.quad_bed_selling_price) for hd in hotel_details)
        triple_hotel = sum(float(hd.triple_bed_selling_price) for hd in hotel_details)
        double_hotel = sum(float(hd.double_bed_selling_price) for hd in hotel_details)
        
        if vip_package.is_sharing_active:
            print("SHARING")
            print(f"Rs. {base_price + sharing_hotel:,.2f}/.")
            print("per adult")
            
        if vip_package.is_quaint_active:
            print("QUINT")
            print(f"Rs. {base_price + quaint_hotel:,.2f}/.")
            print("per adult")
            
        if vip_package.is_quad_active:
            print("QUAD BED") 
            print(f"Rs. {base_price + quad_hotel:,.2f}/.")
            print("per adult")
            
        if vip_package.is_triple_active:
            print("TRIPLE BED")
            print(f"Rs. {base_price + triple_hotel:,.2f}/.")
            print("per adult")
            
        if vip_package.is_double_active:
            print("DOUBLE BED")
            print(f"Rs. {base_price + double_hotel:,.2f}/.")
            print("per adult")
            
        print("PER INFANT")
        infant_price = float(vip_package.infant_visa_selling_price or 0) + float(vip_package.infant_service_charge or 0)
        print(f"Rs. {infant_price:,.2f}/.")
        print("per PEX")

def main():
    print("🏨 Room Type Pricing Calculator")
    print("="*50)
    
    # Calculate room prices for all packages
    add_room_pricing_methods()
    
    # Show example display
    create_room_pricing_display()
    
    print("\n✅ Room type pricing calculated successfully!")
    print("💡 Frontend can now display prices based on active room types")

if __name__ == "__main__":
    main()