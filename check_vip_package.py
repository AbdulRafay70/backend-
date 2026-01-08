#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

def check_vip_package():
    print("🔍 Checking VIP Package Status...")
    print("=" * 50)
    
    # Find the VIP package
    vip_package = UmrahPackage.objects.filter(title__icontains='VIP').first()
    if not vip_package:
        print('❌ VIP package not found')
        return
    
    print(f'📦 Package: {vip_package.title}')
    print(f'🔄 Current Status: {"ACTIVE" if vip_package.is_active else "INACTIVE"}')
    print(f'💰 Price Per Person: Rs. {vip_package.price_per_person:,.2f}')
    print()
    print("🛏️ Room Pricing (using cost methods):")
    print(f'  Sharing: Rs. {vip_package.sharing_cost():,.2f}')
    print(f'  Quint: Rs. {vip_package.quint_cost():,.2f}')
    print(f'  Quad: Rs. {vip_package.quad_cost():,.2f}')
    print(f'  Triple: Rs. {vip_package.triple_cost():,.2f}')
    print(f'  Double: Rs. {vip_package.double_cost():,.2f}')
    print(f'  👶 Infant: Rs. {vip_package.infant_price():,.2f}')
    print()
    print(f'🎫 Total Seats: {vip_package.total_seats}')
    print(f'📍 Available Seats: {vip_package.left_seats}')
    print()
    
    # Check room type active status
    print("🏠 Room Type Status:")
    print(f'  Sharing Active: {vip_package.is_sharing_active}')
    print(f'  Quint Active: {vip_package.is_quaint_active}')
    print(f'  Quad Active: {vip_package.is_quad_active}')
    print(f'  Triple Active: {vip_package.is_triple_active}')
    print(f'  Double Active: {vip_package.is_double_active}')
    
    # Check visa pricing
    print()
    print("💳 Visa Pricing:")
    print(f'  Adult Visa: Rs. {vip_package.adault_visa_selling_price:,.2f}')
    print(f'  Child Visa: Rs. {vip_package.child_visa_selling_price:,.2f}')
    print(f'  Infant Visa: Rs. {vip_package.infant_visa_selling_price:,.2f}')
    
    return vip_package
    print(f'  Quad Active: {vip_package.is_quad_active}')
    print(f'  Triple Active: {vip_package.is_triple_active}')
    print(f'  Double Active: {vip_package.is_double_active}')

if __name__ == "__main__":
    check_vip_package()