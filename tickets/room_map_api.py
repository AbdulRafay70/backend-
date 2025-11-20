from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status, serializers
from rest_framework.exceptions import PermissionDenied
from django.core.files.storage import default_storage
from django.conf import settings
from tickets.models import Hotels, HotelRooms
import os


class RoomMapUploadSerializer(serializers.Serializer):
    """Serializer for room map upload"""
    hotel_id = serializers.IntegerField(required=True)
    floor_number = serializers.IntegerField(required=True, min_value=0)
    map_image = serializers.ImageField(required=True, help_text="Floor map image file")
    
    def validate(self, data):
        # Validate hotel exists
        try:
            hotel = Hotels.objects.get(id=data['hotel_id'])
            data['hotel'] = hotel
        except Hotels.DoesNotExist:
            raise serializers.ValidationError({"hotel_id": "Hotel not found."})
        
        # Validate floor exists
        if not HotelRooms.objects.filter(hotel=hotel, floor=data['floor_number']).exists():
            raise serializers.ValidationError({
                "floor_number": f"Floor {data['floor_number']} does not exist for this hotel."
            })
        
        return data


class RoomMapManagementAPIView(APIView):
    """
    POST /api/hotels/room-map
    Content-Type: multipart/form-data
    
    {
        "hotel_id": 123,
        "floor_number": 2,
        "map_image": <file>
    }
    
    Admin uploads visual floor maps for hotel rooms.
    Stores map images and returns CDN URLs for frontend display.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        # Check owner organization access
        owner_org_id = request.query_params.get('owner_organization')
        if not owner_org_id:
            return Response({
                'error': 'Missing owner_organization parameter',
                'detail': 'owner_organization query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate user has access to this organization (unless superuser)
        if not request.user.is_superuser:
            user_organizations = request.user.organizations.values_list('id', flat=True)
            if int(owner_org_id) not in user_organizations:
                raise PermissionDenied("You don't have access to this organization.")

        serializer = RoomMapUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        hotel = validated_data['hotel']
        floor_number = validated_data['floor_number']
        map_image = validated_data['map_image']
        
        # Validate that the hotel belongs to the user's owner organization
        if hotel.organization_id != int(owner_org_id):
            return Response({
                'error': 'Access denied',
                'detail': 'Hotel does not belong to your organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Create directory structure: media/hotel_maps/{hotel_id}/
            upload_dir = f'hotel_maps/{hotel.id}'
            filename = f'floor_{floor_number}.png'
            file_path = os.path.join(upload_dir, filename)
            
            # Save the file
            saved_path = default_storage.save(file_path, map_image)
            
            # Generate URL
            if hasattr(settings, 'MEDIA_URL'):
                map_url = f"{settings.MEDIA_URL}{saved_path}"
            else:
                map_url = f"/media/{saved_path}"
            
            return Response({
                'success': True,
                'message': 'Floor map uploaded successfully',
                'data': {
                    'hotel_id': hotel.id,
                    'hotel_name': hotel.name,
                    'floor_number': floor_number,
                    'map_url': map_url,
                    'file_path': saved_path
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Upload failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        """
        GET /api/hotels/room-map?hotel_id=123&floor_number=2
        
        Retrieve the floor map URL for a specific floor.
        """
        # Check owner organization access
        owner_org_id = request.query_params.get('owner_organization')
        if not owner_org_id:
            return Response({
                'error': 'Missing owner_organization parameter',
                'detail': 'owner_organization query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate user has access to this organization (unless superuser)
        if not request.user.is_superuser:
            user_organizations = request.user.organizations.values_list('id', flat=True)
            if int(owner_org_id) not in user_organizations:
                raise PermissionDenied("You don't have access to this organization.")

        hotel_id = request.query_params.get('hotel_id')
        floor_number = request.query_params.get('floor_number')
        
        if not hotel_id or not floor_number:
            return Response({
                'error': 'Missing required parameters',
                'detail': "Required: 'hotel_id', 'floor_number'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hotel = Hotels.objects.get(id=hotel_id, organization_id=owner_org_id)
        except Hotels.DoesNotExist:
            return Response({
                'error': 'Hotel not found or not accessible for this organization'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if floor exists
        if not HotelRooms.objects.filter(hotel=hotel, floor=floor_number).exists():
            return Response({
                'error': f'Floor {floor_number} does not exist for this hotel'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Build map file path
        file_path = f'hotel_maps/{hotel.id}/floor_{floor_number}.png'
        
        # Check if file exists
        if default_storage.exists(file_path):
            if hasattr(settings, 'MEDIA_URL'):
                map_url = f"{settings.MEDIA_URL}{file_path}"
            else:
                map_url = f"/media/{file_path}"
            
            return Response({
                'hotel_id': hotel.id,
                'hotel_name': hotel.name,
                'floor_number': floor_number,
                'map_url': map_url,
                'exists': True
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'hotel_id': hotel.id,
                'hotel_name': hotel.name,
                'floor_number': floor_number,
                'map_url': None,
                'exists': False,
                'message': 'No map uploaded for this floor yet'
            }, status=status.HTTP_200_OK)
    
    def delete(self, request):
        """
        DELETE /api/hotels/room-map?hotel_id=123&floor_number=2
        
        Delete a floor map.
        """
        # Check owner organization access
        owner_org_id = request.query_params.get('owner_organization')
        if not owner_org_id:
            return Response({
                'error': 'Missing owner_organization parameter',
                'detail': 'owner_organization query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate user has access to this organization (unless superuser)
        if not request.user.is_superuser:
            user_organizations = request.user.organizations.values_list('id', flat=True)
            if int(owner_org_id) not in user_organizations:
                raise PermissionDenied("You don't have access to this organization.")

        hotel_id = request.query_params.get('hotel_id')
        floor_number = request.query_params.get('floor_number')
        
        if not hotel_id or not floor_number:
            return Response({
                'error': 'Missing required parameters',
                'detail': "Required: 'hotel_id', 'floor_number'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hotel = Hotels.objects.get(id=hotel_id, organization_id=owner_org_id)
        except Hotels.DoesNotExist:
            return Response({
                'error': 'Hotel not found or not accessible for this organization'
            }, status=status.HTTP_404_NOT_FOUND)
        
        file_path = f'hotel_maps/{hotel.id}/floor_{floor_number}.png'
        
        try:
            if default_storage.exists(file_path):
                default_storage.delete(file_path)
                return Response({
                    'success': True,
                    'message': 'Floor map deleted successfully',
                    'hotel_id': hotel.id,
                    'floor_number': floor_number
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Map file not found'
                }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Deletion failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
