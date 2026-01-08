"""
Sample API Views for Package Room Type Pricing
These views show how to implement the room type pricing in your Django REST API
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from packages.models import UmrahPackage
from organization.models import Organization

@api_view(['GET'])
def get_package_with_room_prices(request, package_id):
    """
    API endpoint to get package with room type pricing
    URL: /api/packages/{package_id}/room-prices/
    """
    try:
        package = UmrahPackage.objects.get(id=package_id)
        
        # Get hotel details
        hotel_details = package.hotel_details.all()
        makkah_hotels = [hd.hotel.name for hd in hotel_details if 'makkah' in hd.hotel.city.name.lower()]
        madinah_hotels = [hd.hotel.name for hd in hotel_details if any(city in hd.hotel.city.name.lower() for city in ['madinah', 'medina'])]
        
        # Calculate base price
        base_price = float(package.price_per_person or 0)
        
        # Calculate room type prices - only show if room type is active
        room_prices = []
        
        if hotel_details.exists():
            sharing_hotel = sum(float(hd.sharing_bed_selling_price) for hd in hotel_details)
            quaint_hotel = sum(float(hd.quaint_bed_selling_price) for hd in hotel_details)
            quad_hotel = sum(float(hd.quad_bed_selling_price) for hd in hotel_details)
            triple_hotel = sum(float(hd.triple_bed_selling_price) for hd in hotel_details)
            double_hotel = sum(float(hd.double_bed_selling_price) for hd in hotel_details)
            
            # Only add room types that are explicitly active (true)
            if package.is_sharing_active is True:
                room_prices.append({
                    'room_type': 'sharing',
                    'display_name': 'SHARING',
                    'price': base_price + sharing_hotel,
                    'formatted_price': f"Rs. {base_price + sharing_hotel:,.2f}/.",
                    'per_unit': 'per adult',
                    'active': True
                })
                
            if package.is_quaint_active is True:
                room_prices.append({
                    'room_type': 'quaint', 
                    'display_name': 'QUINT',
                    'price': base_price + quaint_hotel,
                    'formatted_price': f"Rs. {base_price + quaint_hotel:,.2f}/.",
                    'per_unit': 'per adult',
                    'active': True
                })
                
            if package.is_quad_active is True:
                room_prices.append({
                    'room_type': 'quad',
                    'display_name': 'QUAD BED', 
                    'price': base_price + quad_hotel,
                    'formatted_price': f"Rs. {base_price + quad_hotel:,.2f}/.",
                    'per_unit': 'per adult',
                    'active': True
                })
                
            if package.is_triple_active is True:
                room_prices.append({
                    'room_type': 'triple',
                    'display_name': 'TRIPLE BED',
                    'price': base_price + triple_hotel, 
                    'formatted_price': f"Rs. {base_price + triple_hotel:,.2f}/.",
                    'per_unit': 'per adult',
                    'active': True
                })
                
            if package.is_double_active is True:
                room_prices.append({
                    'room_type': 'double',
                    'display_name': 'DOUBLE BED',
                    'price': base_price + double_hotel,
                    'formatted_price': f"Rs. {base_price + double_hotel:,.2f}/.",
                    'per_unit': 'per adult',
                    'active': True
                })
        
        # Add infant pricing
        infant_price = float(package.infant_visa_selling_price or 0) + float(package.infant_service_charge or 0)
        room_prices.append({
            'room_type': 'infant',
            'display_name': 'PER INFANT',
            'price': infant_price,
            'formatted_price': f"Rs. {infant_price:,.2f}/.",
            'per_unit': 'per PEX'
        })
        
        response_data = {
            'id': package.id,
            'title': package.title,
            'hotels': {
                'makkah': makkah_hotels[0] if makkah_hotels else 'Available Makkah Hotels',
                'madinah': madinah_hotels[0] if madinah_hotels else 'Available Madinah Hotels'
            },
            'features': {
                'ziyarat': 'YES' if float(package.makkah_ziyarat_selling_price or 0) > 0 else 'NO',
                'food': 'INCLUDED' if float(package.food_selling_price or 0) > 0 else 'NOT INCLUDED',
                'rules': 'N/A'
            },
            'availability': {
                'seats_left': package.left_seats,
                'status': 'available' if package.left_seats > 0 else 'sold_out'
            },
            'room_types': {
                'sharing_active': bool(package.is_sharing_active),
                'quaint_active': bool(package.is_quaint_active),
                'quad_active': bool(package.is_quad_active),
                'triple_active': bool(package.is_triple_active),
                'double_active': bool(package.is_double_active)
            },
            'pricing': room_prices
        }
        
        return Response(response_data)
        
    except UmrahPackage.DoesNotExist:
        return Response(
            {'error': 'Package not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_all_packages_with_pricing(request):
    """
    API endpoint to get all packages with room pricing for organization
    URL: /api/packages/room-prices/?org_code=ORG-0001
    """
    try:
        org_code = request.GET.get('org_code', 'ORG-0001')
        org = Organization.objects.get(org_code=org_code)
        
        packages = UmrahPackage.objects.filter(
            organization=org,
            is_active=True
        ).prefetch_related('hotel_details__hotel__city', 'ticket_details__ticket')
        
        package_list = []
        
        for package in packages:
            # Get room pricing for each package
            hotel_details = package.hotel_details.all()
            base_price = float(package.price_per_person or 0)
            
            room_prices = []
            
            if hotel_details.exists():
                sharing_hotel = sum(float(hd.sharing_bed_selling_price) for hd in hotel_details)
                quaint_hotel = sum(float(hd.quaint_bed_selling_price) for hd in hotel_details)
                quad_hotel = sum(float(hd.quad_bed_selling_price) for hd in hotel_details)
                triple_hotel = sum(float(hd.triple_bed_selling_price) for hd in hotel_details)
                double_hotel = sum(float(hd.double_bed_selling_price) for hd in hotel_details)
                
                # Only add active room types - check for explicit True
                if package.is_sharing_active is True:
                    room_prices.append({
                        'type': 'SHARING',
                        'price': f"Rs. {base_price + sharing_hotel:,.2f}/.",
                        'per_unit': 'per adult'
                    })
                    
                if package.is_quaint_active is True:
                    room_prices.append({
                        'type': 'QUINT', 
                        'price': f"Rs. {base_price + quaint_hotel:,.2f}/.",
                        'per_unit': 'per adult'
                    })
                    
                if package.is_quad_active is True:
                    room_prices.append({
                        'type': 'QUAD BED',
                        'price': f"Rs. {base_price + quad_hotel:,.2f}/.",
                        'per_unit': 'per adult'
                    })
                    
                if package.is_triple_active is True:
                    room_prices.append({
                        'type': 'TRIPLE BED',
                        'price': f"Rs. {base_price + triple_hotel:,.2f}/.",
                        'per_unit': 'per adult'
                    })
                    
                if package.is_double_active is True:
                    room_prices.append({
                        'type': 'DOUBLE BED',
                        'price': f"Rs. {base_price + double_hotel:,.2f}/.",
                        'per_unit': 'per adult'
                    })
            
            # Add infant pricing
            infant_price = float(package.infant_visa_selling_price or 0) + float(package.infant_service_charge or 0)
            room_prices.append({
                'type': 'PER INFANT',
                'price': f"Rs. {infant_price:,.2f}/.",
                'per_unit': 'per PEX'
            })
            
            makkah_hotels = [hd.hotel.name for hd in hotel_details if 'makkah' in hd.hotel.city.name.lower()]
            madinah_hotels = [hd.hotel.name for hd in hotel_details if any(city in hd.hotel.city.name.lower() for city in ['madinah', 'medina'])]
            
            package_data = {
                'id': package.id,
                'title': package.title,
                'makkah_hotel': makkah_hotels[0] if makkah_hotels else 'Available',
                'madinah_hotel': madinah_hotels[0] if madinah_hotels else 'Available', 
                'ziyarat': 'YES' if float(package.makkah_ziyarat_selling_price or 0) > 0 else 'NO',
                'food': 'INCLUDED' if float(package.food_selling_price or 0) > 0 else 'NOT INCLUDED',
                'rules': 'N/A',
                'seats_left': package.left_seats,
                'pricing': room_prices
            }
            
            package_list.append(package_data)
        
        return Response({
            'organization': org.name,
            'packages': package_list,
            'total_packages': len(package_list)
        })
        
    except Organization.DoesNotExist:
        return Response(
            {'error': 'Organization not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# URL patterns to add to your urls.py:
"""
from django.urls import path
from . import views

urlpatterns = [
    path('api/packages/<int:package_id>/room-prices/', views.get_package_with_room_prices, name='package_room_prices'),
    path('api/packages/room-prices/', views.get_all_packages_with_pricing, name='all_packages_room_prices'),
]
"""

# Frontend JavaScript example:
"""
// Fetch package with room pricing
async function loadPackageCard(packageId) {
    try {
        const response = await fetch(`/api/packages/${packageId}/room-prices/`);
        const data = await response.json();
        
        // Display package card
        displayPackageCard(data);
    } catch (error) {
        console.error('Error loading package:', error);
    }
}

function displayPackageCard(package) {
    const cardHTML = `
        <div class="package-card">
            <h3>${package.title}</h3>
            <div class="hotels">
                <p>MAKKAH HOTEL: ${package.hotels.makkah}</p>
                <p>MADINA HOTEL: ${package.hotels.madinah}</p>
            </div>
            <div class="features">
                <p>ZIYARAT: ${package.features.ziyarat}</p>
                <p>FOOD: ${package.features.food}</p>
                <p>RULES: ${package.features.rules}</p>
            </div>
            <div class="availability">
                <p>${package.availability.seats_left} Seats Left</p>
            </div>
            <div class="pricing">
                ${package.pricing.map(price => `
                    <div class="price-option">
                        <h4>${price.display_name}</h4>
                        <p>${price.formatted_price}</p>
                        <p>${price.per_unit}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('packages-container').innerHTML += cardHTML;
}
"""

print("✅ API views created successfully!")
print("💡 These views provide room type pricing exactly like your example")
print("📋 Add the URL patterns and implement the frontend integration")