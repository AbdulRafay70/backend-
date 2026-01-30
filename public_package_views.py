"""
Public Package API Views
These views handle public-facing package display based on is_active status
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from packages.models import UmrahPackage
from organization.models import Organization
from packages.serializers import UmrahPackageSerializer

@api_view(['GET'])
@permission_classes([AllowAny])  # Public endpoint - no authentication required
def get_public_packages(request):
    """
    Public API endpoint to get only active packages for public display
    URL: /api/public/packages/?org_code=ORG-0001
    """
    try:
        org_code = request.GET.get('org_code', 'ORG-0001')
        
        # Get organization
        try:
            org = Organization.objects.get(org_code=org_code)
        except Organization.DoesNotExist:
            return Response(
                {'error': 'Organization not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get only ACTIVE packages for public display
        packages = UmrahPackage.objects.filter(
            organization=org,
            is_active=True,  # Only active packages for public
            status='active'  # Additional status filter
        ).prefetch_related(
            'hotel_details__hotel__city', 
            'ticket_details__ticket',
            'transport_details__transport_sector'
        ).order_by('-created_at')
        
        # Serialize packages
        serializer = UmrahPackageSerializer(packages, many=True)
        
        response_data = {
            'organization': {
                'id': org.id,
                'name': org.name,
                'code': org.org_code
            },
            'packages': serializer.data,
            'total_packages': packages.count(),
            'message': f'Found {packages.count()} active packages'
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_package_detail(request, package_id):
    """
    Public API endpoint to get single active package details
    URL: /api/public/packages/{package_id}/
    """
    try:
        # Get package - must be active for public access
        package = UmrahPackage.objects.select_related('organization').prefetch_related(
            'hotel_details__hotel__city',
            'ticket_details__ticket', 
            'transport_details__transport_sector'
        ).get(
            id=package_id,
            is_active=True,  # Only active packages for public
            status='active'
        )
        
        # Serialize package
        serializer = UmrahPackageSerializer(package)
        
        return Response({
            'package': serializer.data,
            'organization': {
                'id': package.organization.id,
                'name': package.organization.name,
                'code': package.organization.org_code
            }
        })
        
    except UmrahPackage.DoesNotExist:
        return Response(
            {'error': 'Package not found or not active'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Example of how to add these to your URLs:
"""
# In your urls.py file:
from django.urls import path
from . import public_views

urlpatterns = [
    # Public package endpoints (no authentication required)
    path('api/public/packages/', public_views.get_public_packages, name='public_packages'),
    path('api/public/packages/<int:package_id>/', public_views.get_public_package_detail, name='public_package_detail'),
    
    # Admin package endpoints (authentication required)  
    path('api/umrah-packages/', views.get_all_packages_with_pricing, name='admin_packages'),
    # ... other admin endpoints
]
"""

# Frontend JavaScript example for public page:
frontend_example = '''
// Public page - only shows active packages
async function loadPublicPackages() {
    try {
        const response = await fetch('/api/public/packages/?org_code=ORG-0001');
        const data = await response.json();
        
        console.log(`Found ${data.total_packages} active packages for public display`);
        
        // Display only active packages
        data.packages.forEach(pkg => {
            displayPublicPackageCard(pkg);
        });
        
    } catch (error) {
        console.error('Error loading public packages:', error);
    }
}

// Admin page - shows all packages with filtering
async function loadAdminPackages() {
    try {
        const response = await fetch('/api/umrah-packages/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        // Admin can see all packages and filter by active/inactive
        displayAdminPackages(data);
        
    } catch (error) {
        console.error('Error loading admin packages:', error);
    }
}
'''

print("[SUCCESS] Public package API endpoints created!")
print("[INFO] Key Features:")
print("1. Public endpoint only returns is_active=True packages")
print("2. Admin endpoint returns all packages with filtering")
print("3. Package status badges added to admin interface")
print("4. Clear separation between public and admin views")