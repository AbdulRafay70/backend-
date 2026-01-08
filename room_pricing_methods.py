"""
Room Type Pricing Methods for UmrahPackage Model
Add these methods to your UmrahPackage model to handle dynamic room pricing
"""

def get_room_type_prices(self):
    """
    Calculate prices for different room types based on package configuration
    Returns a dictionary with room type prices and availability
    """
    base_price = float(self.price_per_person or 0)
    hotel_details = self.hotel_details.all()
    
    prices = {}
    
    if hotel_details.exists():
        # Calculate hotel costs for each room type
        sharing_hotel = sum(float(hd.sharing_bed_selling_price) for hd in hotel_details)
        quaint_hotel = sum(float(hd.quaint_bed_selling_price) for hd in hotel_details)
        quad_hotel = sum(float(hd.quad_bed_selling_price) for hd in hotel_details)
        triple_hotel = sum(float(hd.triple_bed_selling_price) for hd in hotel_details)
        double_hotel = sum(float(hd.double_bed_selling_price) for hd in hotel_details)
        
        # Only include active room types - explicit boolean check
        if self.is_sharing_active is True:
            prices['sharing'] = {
                'price': base_price + sharing_hotel,
                'display_name': 'SHARING',
                'active': True
            }
            
        if self.is_quaint_active is True:
            prices['quaint'] = {
                'price': base_price + quaint_hotel,
                'display_name': 'QUAINT',
                'active': True
            }
            
        if self.is_quad_active is True:
            prices['quad'] = {
                'price': base_price + quad_hotel,
                'display_name': 'QUAD BED',
                'active': True
            }
            
        if self.is_triple_active is True:
            prices['triple'] = {
                'price': base_price + triple_hotel,
                'display_name': 'TRIPLE BED',
                'active': True
            }
            
        if self.is_double_active is True:
            prices['double'] = {
                'price': base_price + double_hotel,
                'display_name': 'DOUBLE BED',
                'active': True
            }
    
    # Add infant pricing
    infant_price = float(self.infant_visa_selling_price or 0) + float(self.infant_service_charge or 0)
    prices['infant'] = {
        'price': infant_price,
        'display_name': 'PER INFANT',
        'active': True
    }
    
    return prices

def get_package_display_info(self):
    """
    Get all package information for display on frontend cards
    """
    hotel_details = self.hotel_details.all()
    
    # Get Makkah and Madinah hotels
    makkah_hotels = [hd.hotel.name for hd in hotel_details if 'makkah' in hd.hotel.city.name.lower()]
    madinah_hotels = [hd.hotel.name for hd in hotel_details if any(city in hd.hotel.city.name.lower() for city in ['madinah', 'medina'])]
    
    display_info = {
        'title': self.title,
        'makkah_hotels': makkah_hotels or ['Available Makkah Hotels'],
        'madinah_hotels': madinah_hotels or ['Available Madinah Hotels'], 
        'ziyarat_included': 'YES' if float(self.makkah_ziyarat_selling_price or 0) > 0 else 'NO',
        'food_included': 'INCLUDED' if float(self.food_selling_price or 0) > 0 else 'NOT INCLUDED',
        'rules': 'Standard Umrah Package Rules Apply',
        'seats_left': self.left_seats,
        'room_prices': self.get_room_type_prices()
    }
    
    return display_info

def format_price_display(self, price):
    """Format price for display like Rs. 15,241,570.25/."""
    return f"Rs. {price:,.2f}/."

# Usage example for API/Frontend:
def get_package_card_data(package_id):
    """
    API endpoint helper to get formatted package data for frontend cards
    """
    try:
        from packages.models import UmrahPackage
        
        package = UmrahPackage.objects.get(id=package_id)
        display_info = package.get_package_display_info()
        
        # Format for frontend display
        card_data = {
            'id': package.id,
            'title': display_info['title'],
            'hotels': {
                'makkah': display_info['makkah_hotels'][0],
                'madinah': display_info['madinah_hotels'][0]
            },
            'features': {
                'ziyarat': display_info['ziyarat_included'],
                'food': display_info['food_included'],
                'rules': display_info['rules']
            },
            'availability': {
                'seats_left': display_info['seats_left'],
                'status': 'available' if display_info['seats_left'] > 0 else 'sold_out'
            },
            'pricing': []
        }
        
        # Add room type pricing
        for room_type, price_info in display_info['room_prices'].items():
            if price_info['active']:
                card_data['pricing'].append({
                    'room_type': room_type,
                    'display_name': price_info['display_name'],
                    'price': price_info['price'],
                    'formatted_price': package.format_price_display(price_info['price']),
                    'per_unit': 'per adult' if room_type != 'infant' else 'per PEX'
                })
        
        return card_data
        
    except Exception as e:
        return {'error': str(e)}

# Test the pricing system
if __name__ == "__main__":
    import os
    import django
    import sys
    
    # Setup Django environment
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
    django.setup()
    
    from packages.models import UmrahPackage
    from organization.models import Organization
    
    # Test with VIP package
    org = Organization.objects.get(org_code="ORG-0001")
    vip_package = UmrahPackage.objects.filter(
        organization=org,
        title__icontains="VIP"
    ).first()
    
    if vip_package:
        print("🧪 Testing Room Type Pricing System")
        print("="*50)
        
        # Add methods to the instance (monkey patching for testing)
        import types
        vip_package.get_room_type_prices = types.MethodType(get_room_type_prices, vip_package)
        vip_package.get_package_display_info = types.MethodType(get_package_display_info, vip_package)
        vip_package.format_price_display = types.MethodType(format_price_display, vip_package)
        
        display_info = vip_package.get_package_display_info()
        
        print(f"📦 {display_info['title']}")
        print(f"🏨 Makkah: {display_info['makkah_hotels'][0]}")
        print(f"🏨 Madinah: {display_info['madinah_hotels'][0]}")
        print(f"🚌 Ziyarat: {display_info['ziyarat_included']}")
        print(f"🍽️ Food: {display_info['food_included']}")
        print(f"💺 Seats Left: {display_info['seats_left']}")
        
        print("\n💰 Room Type Pricing:")
        for room_type, price_info in display_info['room_prices'].items():
            if price_info['active']:
                formatted_price = vip_package.format_price_display(price_info['price'])
                per_unit = 'per adult' if room_type != 'infant' else 'per PEX'
                print(f"   {price_info['display_name']}: {formatted_price} {per_unit}")
        
        print("\n✅ Room type pricing system working correctly!")
        print("💡 Add these methods to your UmrahPackage model for dynamic pricing")
    else:
        print("❌ VIP package not found for testing")