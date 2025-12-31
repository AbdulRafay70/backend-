from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Sum
from tickets.models import Hotels, HotelRooms, HotelFloor
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


class HotelFloorsListAPIView(APIView):
    """
    API for listing hotels and their floors by organization.
    Used by admin panel for floor management interface.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    @extend_schema(
        summary="List Hotels with Floor Information",
        description="""
        Retrieve a list of all hotels for a specific organization with their floor details.
        
        **Returns:**
        - List of hotels with unique floors
        - Room count per floor
        - Total beds per floor
        """,
        parameters=[
            OpenApiParameter(
                name='organization',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Organization ID to filter hotels'
            ),
        ],
        responses={
            200: {
                'description': 'List of hotels with floors',
                'content': {
                    'application/json': {
                        'example': {
                            "hotels": [
                                {
                                    "id": 40,
                                    "name": "Hilton Makkah",
                                    "city": "Makkah",
                                    "floors": [
                                        {
                                            "floor_no": "0",
                                            "floor_display": "Ground Floor",
                                            "total_rooms": 15,
                                            "total_beds": 48
                                        },
                                        {
                                            "floor_no": "1",
                                            "floor_display": "1st Floor",
                                            "total_rooms": 20,
                                            "total_beds": 65
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            400: {'description': 'Bad Request - Missing organization parameter'},
            404: {'description': 'No hotels found for this organization'}
        },
        tags=['Hotels']
    )
    def get(self, request):
        """List all hotels with their floors for an organization"""
        organization_id = request.query_params.get('organization')
        
        if not organization_id:
            return Response({
                'error': 'Missing organization parameter',
                'detail': 'organization query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all hotels for this organization
        hotels = Hotels.objects.filter(organization_id=organization_id)
        
        if not hotels.exists():
            return Response({
                'hotels': []
            }, status=status.HTTP_200_OK)
        
        hotels_data = []
        
        for hotel in hotels:
            # Get floors from HotelFloor model
            hotel_floors = HotelFloor.objects.filter(hotel=hotel).order_by('floor_no')
            
            floors_list = []
            for floor_obj in hotel_floors:
                floor_no = floor_obj.floor_no
                
                # Count actual rooms on this floor
                room_count = HotelRooms.objects.filter(hotel=hotel, floor=floor_no).count()
                
                # Calculate total beds for this floor
                total_beds = HotelRooms.objects.filter(
                    hotel=hotel, 
                    floor=floor_no
                ).aggregate(total=Sum('total_beds'))['total'] or 0
                
                # Get floor display name
                floor_display = floor_obj.floor_title or self._get_floor_display(floor_no)
                
                floors_list.append({
                    'id': floor_obj.id,  # Include the database ID for updates
                    'floor_no': floor_no,
                    'floor_title': floor_obj.floor_title,  # Include floor_title for editing
                    'floor_display': floor_display,
                    'total_rooms': room_count,
                    'total_beds': total_beds
                })
            
            # Get city name - handle ForeignKey relationship
            city_name = 'Unknown'
            if hasattr(hotel, 'city') and hotel.city:
                city_name = hotel.city.name if hasattr(hotel.city, 'name') else str(hotel.city)
            
            hotels_data.append({
                'id': hotel.id,
                'name': hotel.name,
                'city': city_name,
                'floors': floors_list
            })
        
        return Response({
            'hotels': hotels_data
        }, status=status.HTTP_200_OK)
    
    def _get_floor_display(self, floor_no):
        """Convert floor number to display name"""
        floor_mapping = {
            'ground': 'Ground Floor',
            '0': 'Ground Floor',
            '1': '1st Floor',
            '2': '2nd Floor',
            '3': '3rd Floor',
            '4': '4th Floor',
            '5': '5th Floor',
            '6': '6th Floor',
            '7': '7th Floor',
            '8': '8th Floor',
            '9': '9th Floor',
            '10': '10th Floor',
            'basement': 'Basement',
        }
        return floor_mapping.get(str(floor_no), f'Floor {floor_no}')
    
    @extend_schema(
        summary="Create a Floor for Hotel",
        description="""
        Create a new floor for a hotel. This creates a placeholder entry that allows rooms to be added later.
        
        **Required Fields:**
        - hotel: Hotel ID
        - floor_no: Floor number (0 for ground, 1-10 for floors)
        - floor_title: Display name for the floor (e.g., "Ground Floor")
        """,
        responses={
            201: {'description': 'Floor created successfully'},
            400: {'description': 'Bad Request - Invalid data'},
        },
        tags=['Hotels']
    )
    def post(self, request):
        """Create a new floor for a hotel"""
        hotel_id = request.data.get('hotel')
        floor_no = request.data.get('floor_no')
        floor_title = request.data.get('floor_title', f'Floor {floor_no}')
        map_image = request.data.get('map_image', None)
        
        if not hotel_id or floor_no is None:
            return Response({
                'error': 'Missing required fields',
                'detail': 'hotel and floor_no are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify hotel exists
        try:
            hotel = Hotels.objects.get(id=hotel_id)
        except Hotels.DoesNotExist:
            return Response({
                'error': 'Hotel not found',
                'detail': f'Hotel with id {hotel_id} does not exist'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if floor already exists
        existing_floor = HotelFloor.objects.filter(hotel=hotel, floor_no=str(floor_no)).first()
        if existing_floor:
            return Response({
                'error': 'Floor already exists',
                'detail': f'Floor {floor_no} already exists for this hotel'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the floor (no placeholder room needed)
        floor = HotelFloor.objects.create(
            hotel=hotel,
            floor_no=str(floor_no),
            floor_title=floor_title,
            map_image=map_image
        )
        
        return Response({
            'message': 'Floor created successfully',
            'floor': {
                'id': floor.id,
                'floor_no': str(floor_no),
                'floor_title': floor_title,
                'hotel_id': hotel_id,
                'hotel_name': hotel.name
            }
        }, status=status.HTTP_201_CREATED)


class HotelFloorDetailAPIView(APIView):
    """
    API for updating and deleting individual hotel floors.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    @extend_schema(
        summary="Update Floor Details",
        description="Update floor number, title, or map image for a specific floor",
        responses={
            200: {'description': 'Floor updated successfully'},
            404: {'description': 'Floor not found'},
        },
        tags=['Hotels']
    )
    def patch(self, request, pk):
        """Update floor details"""
        try:
            floor = HotelFloor.objects.get(pk=pk)
        except HotelFloor.DoesNotExist:
            return Response({
                'error': 'Floor not found',
                'detail': f'Floor with id {pk} does not exist'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update floor fields if provided
        if 'floor_no' in request.data:
            floor.floor_no = str(request.data['floor_no'])
        if 'floor_title' in request.data:
            floor.floor_title = request.data['floor_title']
        if 'map_image' in request.data:
            floor.map_image = request.data['map_image']
        
        floor.save()
        
        return Response({
            'message': 'Floor updated successfully',
            'floor': {
                'id': floor.id,
                'floor_no': floor.floor_no,
                'floor_title': floor.floor_title,
                'hotel_id': floor.hotel.id,
                'hotel_name': floor.hotel.name
            }
        }, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary="Delete Floor",
        description="Delete a floor. Only allowed if no rooms are assigned to this floor.",
        responses={
            200: {'description': 'Floor deleted successfully'},
            400: {'description': 'Floor has rooms assigned'},
            404: {'description': 'Floor not found'},
        },
        tags=['Hotels']
    )
    def delete(self, request, pk):
        """Delete a floor"""
        try:
            floor = HotelFloor.objects.get(pk=pk)
        except HotelFloor.DoesNotExist:
            return Response({
                'error': 'Floor not found',
                'detail': f'Floor with id {pk} does not exist'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if floor has any rooms
        room_count = HotelRooms.objects.filter(hotel=floor.hotel, floor=floor.floor_no).count()
        if room_count > 0:
            return Response({
                'error': 'Cannot delete floor with rooms',
                'detail': f'This floor has {room_count} room(s). Please remove all rooms before deleting the floor.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        floor_no = floor.floor_no
        floor.delete()
        
        return Response({
            'message': 'Floor deleted successfully',
            'floor_no': floor_no
        }, status=status.HTTP_200_OK)
